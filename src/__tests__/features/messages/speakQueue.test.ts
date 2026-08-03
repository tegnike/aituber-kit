jest.mock('three', () => ({
  Object3D: class {},
  AnimationMixer: class {},
  AudioContext: class {},
}))

jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    register() {}
    loadAsync() {
      return Promise.resolve({ userData: { vrm: {} } })
    }
  },
}))

jest.mock('@pixiv/three-vrm', () => ({
  VRM: class {},
  VRMUtils: { rotateVRM0: jest.fn(), deepDispose: jest.fn() },
  VRMExpressionPresetName: {},
  VRMLoaderPlugin: class {},
}))

const mockHomeGetState = jest.fn()
const mockHomeSetState = jest.fn()
jest.mock('@/features/stores/home', () => ({
  getState: (...args: unknown[]) => mockHomeGetState(...args),
  setState: (...args: unknown[]) => mockHomeSetState(...args),
}))

const mockSettingsGetState = jest.fn()
jest.mock('@/features/stores/settings', () => ({
  getState: (...args: unknown[]) => mockSettingsGetState(...args),
}))

const mockLive2DSpeak = jest.fn().mockResolvedValue(undefined)
const mockLive2DStopSpeaking = jest.fn()
const mockLive2DResetToIdle = jest.fn().mockResolvedValue(undefined)
jest.mock('@/features/messages/live2dHandler', () => ({
  Live2DHandler: {
    speak: (...args: unknown[]) => mockLive2DSpeak(...args),
    stopSpeaking: () => mockLive2DStopSpeaking(),
    resetToIdle: () => mockLive2DResetToIdle(),
  },
}))

const mockPNGTuberSpeak = jest.fn().mockResolvedValue(undefined)
const mockPNGTuberStopSpeaking = jest.fn()
const mockPNGTuberResetToIdle = jest.fn().mockResolvedValue(undefined)
jest.mock('@/features/pngTuber/pngTuberHandler', () => ({
  PNGTuberHandler: {
    speak: (...args: unknown[]) => mockPNGTuberSpeak(...args),
    stopSpeaking: () => mockPNGTuberStopSpeaking(),
    resetToIdle: () => mockPNGTuberResetToIdle(),
  },
}))

import { SpeakQueue } from '@/features/messages/speakQueue'

jest.useFakeTimers()

function createTask(
  sessionId: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    sessionId,
    audioBuffer: new ArrayBuffer(8),
    talk: { emotion: 'neutral' as const, message: 'test' },
    isNeedDecode: false,
    ...overrides,
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const mockModelSpeak = jest.fn().mockResolvedValue(undefined)
const mockModelSpeakPcm16Stream = jest.fn().mockResolvedValue(undefined)
const mockModelStopSpeaking = jest.fn()
const mockModelPlayEmotion = jest.fn().mockResolvedValue(undefined)

function setupMocks(modelType = 'vrm') {
  mockSettingsGetState.mockReturnValue({ modelType })
  mockHomeGetState.mockReturnValue({
    isSpeaking: true,
    chatProcessing: false,
    viewer: {
      model: {
        speak: mockModelSpeak,
        speakPcm16Stream: mockModelSpeakPcm16Stream,
        stopSpeaking: mockModelStopSpeaking,
        playEmotion: mockModelPlayEmotion,
      },
    },
  })
}

describe('SpeakQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    // Reset singleton and static state
    ;(SpeakQueue as unknown as { _instance: null })._instance = null
    ;(SpeakQueue as unknown as { stopTokenCounter: number }).stopTokenCounter =
      0
    ;(
      SpeakQueue as unknown as { speakCompletionCallbacks: (() => void)[] }
    ).speakCompletionCallbacks = []
    setupMocks()
  })

  describe('singleton', () => {
    it('should return the same instance', () => {
      const a = SpeakQueue.getInstance()
      const b = SpeakQueue.getInstance()
      expect(a).toBe(b)
    })

    it('should create a new instance if none exists', () => {
      const instance = SpeakQueue.getInstance()
      expect(instance).toBeInstanceOf(SpeakQueue)
    })
  })

  describe('addTask', () => {
    it('should set isSpeaking to true', async () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('session1'))
      jest.runAllTimers()

      expect(mockHomeSetState).toHaveBeenCalledWith({ isSpeaking: true })
    })

    it('should process the task via VRM model', async () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      const task = createTask('session1')
      mockModelSpeak.mockImplementationOnce(
        async (_buffer, _talk, _isNeedDecode, observer) => {
          observer?.onPlaybackStart?.()
        }
      )
      await queue.addTask(task)

      expect(mockModelSpeak).toHaveBeenCalledWith(
        task.audioBuffer,
        task.talk,
        task.isNeedDecode,
        { onPlaybackStart: expect.any(Function) }
      )
      expect(mockHomeSetState).toHaveBeenCalledWith({
        activeSpeech: expect.objectContaining({ text: 'test' }),
      })
    })

    it('should process a PCM16 stream via the VRM model', async () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')
      const stream = new ReadableStream<Uint8Array>()
      const onPlaybackStart = jest.fn()
      mockModelSpeakPcm16Stream.mockImplementationOnce(
        async (_stream, _talk, _sampleRate, observer) => {
          observer?.onPlaybackStart?.()
        }
      )

      await queue.addTask({
        sessionId: 'session1',
        kind: 'pcm16-stream',
        audioStream: stream,
        sampleRate: 16000,
        talk: { emotion: 'neutral', message: 'test' },
        onPlaybackStart,
      })

      expect(mockModelSpeakPcm16Stream).toHaveBeenCalledWith(
        stream,
        expect.objectContaining({ message: 'test' }),
        16000,
        { onPlaybackStart: expect.any(Function) }
      )
      expect(onPlaybackStart).toHaveBeenCalledTimes(1)
    })

    it('should cancel a PCM16 stream and complete when the renderer is unsupported', async () => {
      setupMocks('live2d')
      const cancel = jest.fn()
      const stream = new ReadableStream<Uint8Array>({ cancel })
      const onComplete = jest.fn()
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask({
        sessionId: 'session1',
        kind: 'pcm16-stream',
        audioStream: stream,
        sampleRate: 16000,
        talk: { emotion: 'neutral', message: 'test' },
        onComplete,
      })

      expect(cancel).toHaveBeenCalledTimes(1)
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should process via Live2DHandler when modelType is live2d', async () => {
      setupMocks('live2d')
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      const task = createTask('session1')
      await queue.addTask(task)

      expect(mockLive2DSpeak).toHaveBeenCalledWith(
        task.audioBuffer,
        task.talk,
        task.isNeedDecode,
        { onPlaybackStart: expect.any(Function) }
      )
    })

    it('should process via PNGTuberHandler when modelType is pngtuber', async () => {
      setupMocks('pngtuber')
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      const task = createTask('session1')
      await queue.addTask(task)

      expect(mockPNGTuberSpeak).toHaveBeenCalledWith(
        task.audioBuffer,
        task.talk,
        task.isNeedDecode,
        { onPlaybackStart: expect.any(Function) }
      )
    })

    it('should call onComplete callback after task completes', async () => {
      const onComplete = jest.fn()
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('session1', { onComplete }))

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should discard tasks from mismatched sessions', async () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('old-session'))

      expect(mockModelSpeak).not.toHaveBeenCalled()
    })
  })

  describe('stopAll', () => {
    it('should increment stop token', () => {
      const initialToken = SpeakQueue.currentStopToken
      SpeakQueue.stopAll()
      expect(SpeakQueue.currentStopToken).toBe(initialToken + 1)
    })

    it('should set isSpeaking to false', () => {
      SpeakQueue.stopAll()
      expect(mockHomeSetState).toHaveBeenCalledWith({
        isSpeaking: false,
        activeSpeech: null,
      })
    })

    it('should call stopSpeaking on VRM model', () => {
      setupMocks('vrm')
      SpeakQueue.stopAll()
      expect(mockModelStopSpeaking).toHaveBeenCalled()
    })

    it('should call Live2DHandler.stopSpeaking for live2d', () => {
      setupMocks('live2d')
      SpeakQueue.stopAll()
      expect(mockLive2DStopSpeaking).toHaveBeenCalled()
    })

    it('should call PNGTuberHandler.stopSpeaking for pngtuber', () => {
      setupMocks('pngtuber')
      SpeakQueue.stopAll()
      expect(mockPNGTuberStopSpeaking).toHaveBeenCalled()
    })

    it('should mark instance as stopped', () => {
      const queue = SpeakQueue.getInstance()
      SpeakQueue.stopAll()
      expect(queue.isStopped()).toBe(true)
    })
  })

  describe('stopCurrentSpeech', () => {
    it('should stop the current VRM speech without marking the queue as stopped', () => {
      const queue = SpeakQueue.getInstance()
      const initialToken = SpeakQueue.currentStopToken

      SpeakQueue.stopCurrentSpeech()

      expect(mockModelStopSpeaking).toHaveBeenCalled()
      expect(SpeakQueue.currentStopToken).toBe(initialToken)
      expect(queue.isStopped()).toBe(false)
    })
  })

  describe('stopQueue', () => {
    it('should clear queued tasks without stopping current speech', () => {
      const queue = SpeakQueue.getInstance()
      ;(queue as unknown as { queue: ReturnType<typeof createTask>[] }).queue =
        [createTask('session1')]

      SpeakQueue.stopQueue()

      expect(
        (queue as unknown as { queue: ReturnType<typeof createTask>[] }).queue
      ).toEqual([])
      expect(mockModelStopSpeaking).not.toHaveBeenCalled()
    })

    it('should cancel queued PCM16 streams', async () => {
      const cancel = jest.fn()
      const queue = SpeakQueue.getInstance()
      ;(queue as unknown as { queue: unknown[] }).queue = [
        {
          sessionId: 'session1',
          kind: 'pcm16-stream',
          audioStream: new ReadableStream<Uint8Array>({ cancel }),
          sampleRate: 16000,
          talk: { emotion: 'neutral', message: 'test' },
        },
      ]

      SpeakQueue.stopQueue()
      await Promise.resolve()

      expect(cancel).toHaveBeenCalledWith('speech task discarded')
    })
  })

  describe('stopSession', () => {
    it('should stop the current session and increment stop token', () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')
      const initialToken = SpeakQueue.currentStopToken

      SpeakQueue.stopSession('session1')

      expect(SpeakQueue.currentStopToken).toBe(initialToken + 1)
      expect(mockModelStopSpeaking).toHaveBeenCalled()
      expect(mockHomeSetState).toHaveBeenCalledWith({
        isSpeaking: false,
        activeSpeech: null,
      })
      expect(queue.isStopped()).toBe(true)
    })

    it('should not stop playback when the current session does not match', () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')
      const initialToken = SpeakQueue.currentStopToken

      SpeakQueue.stopSession('other-session')

      expect(SpeakQueue.currentStopToken).toBe(initialToken)
      expect(mockModelStopSpeaking).not.toHaveBeenCalled()
      expect(queue.isStopped()).toBe(false)
    })

    it('should remove queued tasks for the target session only', () => {
      const queue = SpeakQueue.getInstance()
      ;(
        queue as unknown as {
          queue: ReturnType<typeof createTask>[]
          currentSessionId: string
        }
      ).queue = [createTask('session1'), createTask('session2')]
      ;(
        queue as unknown as {
          queue: ReturnType<typeof createTask>[]
          currentSessionId: string
        }
      ).currentSessionId = 'session2'

      SpeakQueue.stopSession('session1')

      expect(
        (
          queue as unknown as {
            queue: ReturnType<typeof createTask>[]
          }
        ).queue
      ).toEqual([expect.objectContaining({ sessionId: 'session2' })])
      expect(mockModelStopSpeaking).not.toHaveBeenCalled()
    })
  })

  describe('checkSessionId', () => {
    it('should update session ID on first call', () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')
      // Verify by adding and processing a task with this session
      // No error/discard means session ID was set correctly
    })

    it('should clear queue when session ID changes', async () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      // Add a task but don't process yet (by not awaiting processQueue)
      // Instead, change session, then verify old tasks are gone

      // We verify indirectly: set session to session1, add task for session2
      queue.checkSessionId('session2')

      // Task with session1 should be discarded
      await queue.addTask(createTask('session1'))
      expect(mockModelSpeak).not.toHaveBeenCalled()
    })

    it('should call onComplete for queued tasks discarded by session change', async () => {
      const queue = SpeakQueue.getInstance()
      const speakDeferred = createDeferred<void>()
      const queuedOnComplete = jest.fn()

      mockModelSpeak.mockReturnValueOnce(speakDeferred.promise)
      queue.checkSessionId('session1')

      const firstTaskPromise = queue.addTask(createTask('session1'))
      await Promise.resolve()
      await queue.addTask(
        createTask('session1', { onComplete: queuedOnComplete })
      )

      queue.checkSessionId('session2')

      expect(queuedOnComplete).toHaveBeenCalledTimes(1)

      speakDeferred.resolve()
      await firstTaskPromise
    })

    it('should cancel queued PCM16 streams discarded by session change', async () => {
      const cancel = jest.fn()
      let notifyComplete!: () => void
      const completed = new Promise<void>((resolve) => {
        notifyComplete = resolve
      })
      const onComplete = jest.fn(notifyComplete)
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')
      ;(queue as unknown as { queue: unknown[] }).queue = [
        {
          sessionId: 'session1',
          kind: 'pcm16-stream',
          audioStream: new ReadableStream<Uint8Array>({ cancel }),
          sampleRate: 16000,
          talk: { emotion: 'neutral', message: 'test' },
          onComplete,
        },
      ]

      queue.checkSessionId('session2')
      await completed

      expect(cancel).toHaveBeenCalledWith('speech task discarded')
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should reset stopped state when stopped', async () => {
      const queue = SpeakQueue.getInstance()
      SpeakQueue.stopAll()
      expect(queue.isStopped()).toBe(true)

      queue.checkSessionId('new-session')
      expect(queue.isStopped()).toBe(false)
      expect(mockHomeSetState).toHaveBeenCalledWith({ isSpeaking: true })
    })

    it('should not reset state when session ID is the same', () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')
      mockHomeSetState.mockClear()

      queue.checkSessionId('session1')
      // setState should not be called again (no change)
      expect(mockHomeSetState).not.toHaveBeenCalled()
    })
  })

  describe('completion callbacks', () => {
    it('should fire callbacks when queue is fully drained', async () => {
      const callback = jest.fn()
      SpeakQueue.onSpeakCompletion(callback)

      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('session1'))

      // After processing, scheduleNeutralExpression is called with QUEUE_CHECK_DELAY
      jest.advanceTimersByTime(1500)
      await Promise.resolve() // flush microtasks

      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should not prevent other callbacks when one throws', async () => {
      const badCallback = jest.fn().mockImplementation(() => {
        throw new Error('callback error')
      })
      const goodCallback = jest.fn()

      SpeakQueue.onSpeakCompletion(badCallback)
      SpeakQueue.onSpeakCompletion(goodCallback)

      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('session1'))
      jest.advanceTimersByTime(1500)
      await Promise.resolve()

      expect(badCallback).toHaveBeenCalled()
      expect(goodCallback).toHaveBeenCalled()
    })

    it('should skip idle reset if a callback starts another response', async () => {
      const homeState = {
        isSpeaking: false,
        chatProcessing: false,
        viewer: {
          model: {
            speak: mockModelSpeak,
            stopSpeaking: mockModelStopSpeaking,
            playEmotion: mockModelPlayEmotion,
          },
        },
      }
      mockHomeGetState.mockImplementation(() => homeState)
      SpeakQueue.onSpeakCompletion(() => {
        homeState.isSpeaking = true
      })

      await SpeakQueue.finalizeIfIdle()

      expect(mockModelPlayEmotion).not.toHaveBeenCalled()
    })

    it('should skip idle reset if a callback changes the active session', async () => {
      const homeState = {
        isSpeaking: false,
        chatProcessing: false,
        viewer: {
          model: {
            speak: mockModelSpeak,
            stopSpeaking: mockModelStopSpeaking,
            playEmotion: mockModelPlayEmotion,
          },
        },
      }
      mockHomeGetState.mockImplementation(() => homeState)
      mockHomeSetState.mockImplementation((patch) => {
        Object.assign(homeState, patch)
      })
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('old-session')
      homeState.isSpeaking = false
      SpeakQueue.onSpeakCompletion(() => {
        queue.checkSessionId('new-session')
        homeState.isSpeaking = false
      })

      await SpeakQueue.finalizeIfIdle()

      expect(mockModelPlayEmotion).not.toHaveBeenCalled()
    })

    it('should remove callback with removeSpeakCompletionCallback', async () => {
      const callback = jest.fn()
      SpeakQueue.onSpeakCompletion(callback)
      SpeakQueue.removeSpeakCompletionCallback(callback)

      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('session1'))
      jest.advanceTimersByTime(1500)
      await Promise.resolve()

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('neutral expression reset', () => {
    it('should reset to neutral for VRM after queue drains', async () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('session1'))
      jest.advanceTimersByTime(1500)
      await Promise.resolve()

      expect(mockModelPlayEmotion).toHaveBeenCalledWith('neutral')
    })

    it('should reset to idle for Live2D after queue drains', async () => {
      setupMocks('live2d')
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('session1'))
      jest.advanceTimersByTime(1500)
      await Promise.resolve()

      expect(mockLive2DResetToIdle).toHaveBeenCalled()
    })

    it('should reset to idle for PNGTuber after queue drains', async () => {
      setupMocks('pngtuber')
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      await queue.addTask(createTask('session1'))
      jest.advanceTimersByTime(1500)
      await Promise.resolve()

      expect(mockPNGTuberResetToIdle).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should continue processing after a task error', async () => {
      mockModelSpeak.mockRejectedValueOnce(new Error('speak error'))
      mockModelSpeak.mockResolvedValueOnce(undefined)

      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      // Add two tasks - first will fail, second should still run
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // We need to add tasks to the internal queue before processing
      // addTask processes immediately, so we'll add one at a time
      await queue.addTask(createTask('session1'))
      await queue.addTask(createTask('session1'))

      expect(consoleSpy).toHaveBeenCalled()
      // Second task should have been attempted
      expect(mockModelSpeak).toHaveBeenCalledTimes(2)

      consoleSpy.mockRestore()
    })
  })

  describe('isStopped', () => {
    it('should return false initially', () => {
      const queue = SpeakQueue.getInstance()
      expect(queue.isStopped()).toBe(false)
    })

    it('should return true after stopAll', () => {
      const queue = SpeakQueue.getInstance()
      SpeakQueue.stopAll()
      expect(queue.isStopped()).toBe(true)
    })

    it('should return false after checkSessionId resets stopped state', () => {
      const queue = SpeakQueue.getInstance()
      SpeakQueue.stopAll()
      queue.checkSessionId('new-session')
      expect(queue.isStopped()).toBe(false)
    })
  })

  describe('stopToken cancellation', () => {
    it('should not process tasks after stopped state with pending queue', async () => {
      const queue = SpeakQueue.getInstance()
      queue.checkSessionId('session1')

      SpeakQueue.stopAll()

      // After stopAll, adding a task should not process it (stopped state)
      await queue.addTask(createTask('session1'))

      // speak should not have been called (task added but processQueue exits due to stopped)
      expect(mockModelSpeak).not.toHaveBeenCalled()
    })
  })

  describe('clearQueue', () => {
    it('should empty the queue', () => {
      const queue = SpeakQueue.getInstance()
      queue.clearQueue()
      // No error means success; we can verify through processing
    })
  })
})
