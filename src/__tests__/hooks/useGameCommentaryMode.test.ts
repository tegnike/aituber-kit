/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from '@testing-library/react'
import { useGameCommentaryMode } from '@/hooks/useGameCommentaryMode'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { generateGameCommentary } from '@/features/gameCommentary/generateGameCommentary'
import { analyzeGameCommentaryScene } from '@/features/gameCommentary/analyzeGameCommentaryScene'
import { SpeakQueue } from '@/features/messages/speakQueue'

const mockCaptureFrame = jest.fn<string | Promise<string>, []>(
  () => 'data:image/jpeg;base64,test'
)
const mockCaptureAvailable = jest.fn(() => true)
const mockGenerateGameCommentary = generateGameCommentary as jest.Mock
const mockAnalyzeGameCommentaryScene = analyzeGameCommentaryScene as jest.Mock
const mockStopSession = SpeakQueue.stopSession as jest.Mock
const mockSpeakCharacter = jest.fn()

let settingsState: Record<string, unknown>
let homeState: Record<string, unknown>
let homeSubscriber:
  | ((state: typeof homeState, prevState: typeof homeState) => void)
  | undefined
let settingsSubscriber: (() => void) | undefined

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

jest.mock('@/features/stores/settings', () => {
  const mockFn = jest.fn()
  return {
    __esModule: true,
    default: Object.assign(mockFn, {
      getState: jest.fn(),
      setState: jest.fn(),
      subscribe: jest.fn((callback: () => void) => {
        settingsSubscriber = callback
        return jest.fn()
      }),
    }),
  }
})

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(),
    setState: jest.fn(),
    subscribe: jest.fn((callback: typeof homeSubscriber) => {
      homeSubscriber = callback
      return jest.fn()
    }),
  },
}))

jest.mock('@/features/gameCommentary/captureService', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      isAvailable: mockCaptureAvailable,
      captureFrame: mockCaptureFrame,
    }),
  },
}))

jest.mock('@/features/gameCommentary/generateGameCommentary', () => ({
  __esModule: true,
  generateGameCommentary: jest.fn(),
}))

jest.mock('@/features/gameCommentary/analyzeGameCommentaryScene', () => ({
  __esModule: true,
  analyzeGameCommentaryScene: jest.fn(),
}))

jest.mock('@/features/messages/speakCharacter', () => ({
  speakCharacter: (...args: unknown[]) => mockSpeakCharacter(...args),
}))

jest.mock('@/features/messages/speakQueue', () => ({
  SpeakQueue: {
    getInstance: jest.fn(() => ({
      addTask: jest.fn(),
      clearQueue: jest.fn(),
      checkSessionId: jest.fn(),
    })),
    stopAll: jest.fn(),
    stopSession: jest.fn(),
    onSpeakCompletion: jest.fn(),
    removeSpeakCompletionCallback: jest.fn(),
  },
}))

function setupSettingsState(overrides: Record<string, unknown> = {}) {
  settingsState = {
    gameCommentaryEnabled: true,
    gameCommentaryPlaying: true,
    gameCommentaryCaptureInterval: 5,
    gameCommentaryContextCount: 5,
    maxPastMessages: 10,
    gameCommentaryImageQuality: 0.7,
    gameCommentaryResizeWidth: 1024,
    gameCommentaryBackgroundAnalysisEnabled: false,
    gameCommentaryBackgroundAnalysisInterval: 2,
    gameCommentarySaveToChat: false,
    ...overrides,
  }

  const mockedSettingsStore = settingsStore as unknown as jest.Mock & {
    getState: jest.Mock
  }
  mockedSettingsStore.mockImplementation(
    (selector: (state: typeof settingsState) => unknown) =>
      selector ? selector(settingsState) : settingsState
  )
  mockedSettingsStore.getState.mockImplementation(() => settingsState)
}

function setupHomeState(overrides: Record<string, unknown> = {}) {
  homeState = {
    chatProcessing: false,
    chatProcessingCount: 0,
    isSpeaking: false,
    captureStatus: true,
    chatLog: [],
    upsertMessage: jest.fn(),
    ...overrides,
  }

  const mockedHomeStore = homeStore as unknown as {
    getState: jest.Mock
    setState: jest.Mock
  }
  mockedHomeStore.getState.mockImplementation(() => homeState)
  mockedHomeStore.setState.mockImplementation(
    (
      partial:
        | Partial<typeof homeState>
        | ((state: typeof homeState) => Partial<typeof homeState>)
    ) => {
      const update =
        typeof partial === 'function' ? partial(homeState) : partial
      homeState = { ...homeState, ...update }
    }
  )
}

async function flushAsync() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('useGameCommentaryMode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSpeakCharacter.mockImplementation(() => {})
    jest.useFakeTimers()
    homeSubscriber = undefined
    settingsSubscriber = undefined
    setupSettingsState()
    setupHomeState()
    mockGenerateGameCommentary.mockResolvedValue({
      text: '実況テストです。',
      emotion: 'neutral',
      sceneDescription: 'テストシーン',
    })
    mockAnalyzeGameCommentaryScene.mockResolvedValue('背景解析テスト')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('reschedules commentary after a user chat interrupts speaking', async () => {
    const { result } = renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.state).toBe('speaking')
    })

    expect(mockGenerateGameCommentary).toHaveBeenCalledTimes(1)
    expect(homeSubscriber).toBeDefined()

    const prevState = homeState
    const nextState = {
      ...homeState,
      chatLog: [
        {
          id: 'user-1',
          role: 'user',
          content: '今どうなってる？',
          timestamp: new Date().toISOString(),
        },
      ],
    }

    await act(async () => {
      homeState = nextState
      homeSubscriber?.(nextState, prevState)
      await Promise.resolve()
    })

    expect(mockStopSession).toHaveBeenCalledWith(
      expect.stringMatching(/^game-commentary-/)
    )
    expect(result.current.state).toBe('waiting')
    expect(result.current.secondsUntilNextCapture).toBe(5)

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockGenerateGameCommentary).toHaveBeenCalledTimes(2)
  })

  it('cancels an in-flight commentary generation when a user chat arrives during capturing', async () => {
    const deferred = createDeferred<{
      text: string
      emotion: string
      sceneDescription: string
    }>()
    mockGenerateGameCommentary.mockReturnValueOnce(deferred.promise)

    const { result } = renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.state).toBe('capturing')
    })

    const prevState = homeState
    const nextState = {
      ...homeState,
      chatLog: [
        {
          id: 'user-capturing',
          role: 'user',
          content: '割り込みです',
          timestamp: new Date().toISOString(),
        },
      ],
    }

    await act(async () => {
      homeState = nextState
      homeSubscriber?.(nextState, prevState)
      await Promise.resolve()
    })

    expect(mockStopSession).toHaveBeenCalledWith(null)
    expect(result.current.state).toBe('waiting')
    expect(mockGenerateGameCommentary.mock.calls[0][4].signal.aborted).toBe(
      true
    )

    await act(async () => {
      deferred.resolve({
        text: '古い実況です。',
        emotion: 'neutral',
        sceneDescription: '古いシーン',
      })
      await deferred.promise
      await Promise.resolve()
    })

    expect(mockSpeakCharacter).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockGenerateGameCommentary).toHaveBeenCalledTimes(2)
  })

  it('reschedules commentary when captureFrame rejects', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    mockCaptureFrame.mockRejectedValueOnce(new Error('capture failed'))

    const { result } = renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.state).toBe('waiting')
    })
    expect(mockGenerateGameCommentary).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockCaptureFrame).toHaveBeenCalledTimes(2)
    expect(mockGenerateGameCommentary).toHaveBeenCalledTimes(1)

    consoleErrorSpy.mockRestore()
  })

  it('does not generate commentary from a stale capture after interruption', async () => {
    const deferred = createDeferred<string>()
    mockCaptureFrame.mockReturnValueOnce(deferred.promise)

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    const prevState = homeState
    const nextState = {
      ...homeState,
      chatProcessing: true,
    }

    await act(async () => {
      homeState = nextState
      homeSubscriber?.(nextState, prevState)
      await Promise.resolve()
    })

    await act(async () => {
      deferred.resolve('data:image/jpeg;base64,stale')
      await deferred.promise
      await Promise.resolve()
    })

    expect(mockGenerateGameCommentary).not.toHaveBeenCalled()

    await act(async () => {
      homeState = {
        ...homeState,
        chatProcessing: false,
      }
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockGenerateGameCommentary).toHaveBeenCalledTimes(1)
  })

  it('cancels an in-flight commentary generation when another chat process starts', async () => {
    const deferred = createDeferred<{
      text: string
      emotion: string
      sceneDescription: string
    }>()
    mockGenerateGameCommentary.mockReturnValueOnce(deferred.promise)

    const { result } = renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.state).toBe('capturing')
    })

    const prevState = homeState
    const nextState = {
      ...homeState,
      chatProcessing: true,
    }

    await act(async () => {
      homeState = nextState
      homeSubscriber?.(nextState, prevState)
      await Promise.resolve()
    })

    expect(mockStopSession).toHaveBeenCalledWith(null)
    expect(result.current.state).toBe('waiting')
    expect(mockGenerateGameCommentary.mock.calls[0][4].signal.aborted).toBe(
      true
    )
  })

  it('does not stop itself when its own speech flips isSpeaking during capturing', async () => {
    // speakCharacter（実機ではSpeakQueue.checkSessionId）は呼び出しと同期的に
    // isSpeaking: false→true を発火させる。これを自分への割り込みと誤検知しないこと。
    mockSpeakCharacter.mockImplementation(() => {
      if (!homeState.isSpeaking) {
        const prevState = homeState
        homeState = { ...homeState, isSpeaking: true }
        homeSubscriber?.(homeState, prevState)
      }
    })

    const deferred = createDeferred<{
      text: string
      emotion: string
      sceneDescription: string
    }>()
    mockGenerateGameCommentary.mockReturnValueOnce(deferred.promise)

    const { result } = renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    // 生成中（capturing）のrenderを確実に挟み、stateRefを'capturing'に同期させる
    await waitFor(() => {
      expect(result.current.state).toBe('capturing')
    })

    await act(async () => {
      deferred.resolve({
        text: '実況テストです。',
        emotion: 'neutral',
        sceneDescription: 'テストシーン',
      })
      await deferred.promise
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(result.current.state).toBe('speaking')
    })

    expect(mockSpeakCharacter).toHaveBeenCalled()
    expect(mockStopSession).not.toHaveBeenCalled()
  })

  it('sends no chat context when maxPastMessages is zero', async () => {
    setupSettingsState({ maxPastMessages: 0 })
    setupHomeState({
      chatLog: [
        { id: '1', role: 'user', content: 'm1', timestamp: '2026-01-01' },
        { id: '2', role: 'assistant', content: 'm2', timestamp: '2026-01-01' },
      ],
    })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockGenerateGameCommentary).toHaveBeenCalledWith(
      expect.any(Array),
      'data:image/jpeg;base64,test',
      [],
      [],
      expect.objectContaining({ signal: expect.any(Object) })
    )
  })

  it('uses maxPastMessages for recent chat context during commentary generation', async () => {
    setupSettingsState({ maxPastMessages: 3 })
    setupHomeState({
      chatLog: [
        { id: '1', role: 'user', content: 'm1', timestamp: '2026-01-01' },
        { id: '2', role: 'assistant', content: 'm2', timestamp: '2026-01-01' },
        { id: '3', role: 'user', content: 'm3', timestamp: '2026-01-01' },
        { id: '4', role: 'assistant', content: 'm4', timestamp: '2026-01-01' },
        { id: '5', role: 'user', content: 'm5', timestamp: '2026-01-01' },
      ],
    })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockGenerateGameCommentary).toHaveBeenCalledWith(
      expect.any(Array),
      'data:image/jpeg;base64,test',
      [
        { role: 'user', content: 'm3' },
        { role: 'assistant', content: 'm4' },
        { role: 'user', content: 'm5' },
      ],
      [],
      expect.objectContaining({ signal: expect.any(Object) })
    )
  })

  it('passes mixed viewer comments and saved commentary as recent context', async () => {
    setupSettingsState({ maxPastMessages: 3 })
    setupHomeState({
      chatLog: [
        {
          id: '1',
          role: 'assistant',
          content: 'old assistant message',
          timestamp: '2026-01-01',
        },
        {
          id: '2',
          role: 'user',
          content: 'OneComme viewer comment',
          timestamp: '2026-01-01',
        },
        {
          id: '3',
          role: 'assistant',
          content: '[実況] first commentary',
          timestamp: '2026-01-01',
        },
        {
          id: '4',
          role: 'user',
          content: 'follow-up viewer comment',
          timestamp: '2026-01-01',
        },
      ],
    })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockGenerateGameCommentary).toHaveBeenCalledWith(
      expect.any(Array),
      'data:image/jpeg;base64,test',
      [
        { role: 'user', content: 'OneComme viewer comment' },
        { role: 'assistant', content: '[実況] first commentary' },
        { role: 'user', content: 'follow-up viewer comment' },
      ],
      [],
      expect.objectContaining({ signal: expect.any(Object) })
    )
  })

  it('saves generated commentary to chat log when enabled', async () => {
    const upsertMessage = jest.fn()
    setupSettingsState({ gameCommentarySaveToChat: true })
    setupHomeState({ upsertMessage })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(upsertMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: '[実況] 実況テストです。',
      })
    )
  })

  it('does not save generated commentary to chat log when disabled', async () => {
    const upsertMessage = jest.fn()
    setupSettingsState({ gameCommentarySaveToChat: false })
    setupHomeState({ upsertMessage })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(upsertMessage).not.toHaveBeenCalled()
  })

  it('uses a runtime lower bound when capture interval is set to zero', async () => {
    setupSettingsState({ gameCommentaryCaptureInterval: 0 })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(2999)
      await Promise.resolve()
    })

    expect(mockGenerateGameCommentary).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(1)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockGenerateGameCommentary).toHaveBeenCalledTimes(1)
  })

  it('preserves zero resize width as no resize when capturing', async () => {
    setupSettingsState({ gameCommentaryResizeWidth: 0 })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockCaptureFrame).toHaveBeenCalledWith(0, 0.7)
  })

  it('preserves zero image quality when capturing', async () => {
    setupSettingsState({ gameCommentaryImageQuality: 0 })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockCaptureFrame).toHaveBeenCalledWith(1024, 0)
  })

  it('uses the latest commentary callback when settings change before the scheduled capture', async () => {
    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      settingsState = {
        ...settingsState,
        gameCommentaryResizeWidth: 0,
      }
      settingsSubscriber?.()
      await Promise.resolve()
    })

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockCaptureFrame).toHaveBeenCalledWith(0, 0.7)
  })

  it('reschedules the waiting timer when capture interval changes', async () => {
    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      settingsState = {
        ...settingsState,
        gameCommentaryCaptureInterval: 10,
      }
      settingsSubscriber?.()
      await Promise.resolve()
    })

    await act(async () => {
      jest.advanceTimersByTime(9999)
      await Promise.resolve()
    })

    expect(mockGenerateGameCommentary).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(1)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockGenerateGameCommentary).toHaveBeenCalledTimes(1)
  })

  it('uses a runtime lower bound for background analysis interval', async () => {
    setupSettingsState({
      gameCommentaryBackgroundAnalysisEnabled: true,
      gameCommentaryBackgroundAnalysisInterval: 0,
    })

    renderHook(() => useGameCommentaryMode({}))

    await act(async () => {
      jest.advanceTimersByTime(5000)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(mockGenerateGameCommentary).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      jest.advanceTimersByTime(999)
      await Promise.resolve()
    })

    expect(mockAnalyzeGameCommentaryScene).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(1)
      await Promise.resolve()
    })

    await flushAsync()

    expect(mockAnalyzeGameCommentaryScene).toHaveBeenCalledTimes(1)
  })
})
