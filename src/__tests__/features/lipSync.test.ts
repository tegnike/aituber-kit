import { LipSync } from '@/features/lipSync/lipSync'

describe('LipSync PCM16 streaming', () => {
  it('schedules incoming PCM before the stream finishes', async () => {
    const starts: number[] = []
    const sourceNodes: Array<{
      buffer: AudioBuffer | null
      onended: (() => void) | null
      connect: jest.Mock
      start: jest.Mock
      stop: jest.Mock
    }> = []
    const audioContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      createAnalyser: jest.fn(() => ({
        getFloatTimeDomainData: jest.fn(),
      })),
      createBuffer: jest.fn(
        (_channels: number, length: number, sampleRate: number) => ({
          duration: length / sampleRate,
          getChannelData: () => new Float32Array(length),
        })
      ),
      createBufferSource: jest.fn(() => {
        const source: {
          buffer: AudioBuffer | null
          onended: (() => void) | null
          connect: jest.Mock
          start: jest.Mock
          stop: jest.Mock
        } = {
          buffer: null,
          onended: null,
          connect: jest.fn(),
          start: jest.fn((at: number) => {
            starts.push(at)
            queueMicrotask(() => source.onended?.())
          }),
          stop: jest.fn(() => source.onended?.()),
        }
        sourceNodes.push(source)
        return source
      }),
      resume: jest.fn(),
    }
    const lipSync = new LipSync(audioContext as unknown as AudioContext, {
      forceStart: true,
    })
    const onStarted = jest.fn()
    const pcmChunk = new Uint8Array(3200)
    let streamController!: ReadableStreamDefaultController<Uint8Array>
    let notifyFirstStart!: () => void
    const firstStart = new Promise<void>((resolve) => {
      notifyFirstStart = resolve
    })
    sourceNodes.length = 0
    audioContext.createBufferSource.mockImplementation(() => {
      const source: {
        buffer: AudioBuffer | null
        onended: (() => void) | null
        connect: jest.Mock
        start: jest.Mock
        stop: jest.Mock
      } = {
        buffer: null,
        onended: null,
        connect: jest.fn(),
        start: jest.fn((at: number) => {
          starts.push(at)
          notifyFirstStart()
          queueMicrotask(() => source.onended?.())
        }),
        stop: jest.fn(() => source.onended?.()),
      }
      sourceNodes.push(source)
      return source
    })
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller
        controller.enqueue(pcmChunk)
      },
    })

    const playback = lipSync.playPcm16Stream(
      stream,
      undefined,
      16000,
      onStarted
    )
    await firstStart

    expect(onStarted).toHaveBeenCalledTimes(1)
    expect(sourceNodes).toHaveLength(1)

    streamController.enqueue(pcmChunk)
    streamController.close()
    await playback

    expect(audioContext.createBuffer).toHaveBeenCalledTimes(2)
    expect(sourceNodes).toHaveLength(2)
    expect(starts[0]).toBeLessThan(starts[1])
    expect(onStarted).toHaveBeenCalledTimes(1)
  })

  it('limits scheduled PCM read-ahead until playback advances', async () => {
    const sourceNodes: Array<{
      onended: (() => void) | null
      start: jest.Mock
      stop: jest.Mock
    }> = []
    let notifyReadAheadLimit!: () => void
    const readAheadLimitReached = new Promise<void>((resolve) => {
      notifyReadAheadLimit = resolve
    })
    let notifyAllScheduled!: () => void
    const allScheduled = new Promise<void>((resolve) => {
      notifyAllScheduled = resolve
    })
    const audioContext = {
      state: 'running',
      currentTime: 0,
      destination: {},
      createAnalyser: jest.fn(() => ({
        getFloatTimeDomainData: jest.fn(),
      })),
      createBuffer: jest.fn(
        (_channels: number, length: number, sampleRate: number) => ({
          duration: length / sampleRate,
          getChannelData: () => new Float32Array(length),
        })
      ),
      createBufferSource: jest.fn(() => {
        const source: {
          buffer: null
          onended: (() => void) | null
          connect: jest.Mock
          start: jest.Mock
          stop: jest.Mock
        } = {
          buffer: null,
          onended: null,
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(() => source.onended?.()),
        }
        sourceNodes.push(source)
        if (sourceNodes.length === 15) notifyReadAheadLimit()
        if (sourceNodes.length === 20) notifyAllScheduled()
        return source
      }),
      resume: jest.fn(),
    }
    const lipSync = new LipSync(audioContext as unknown as AudioContext, {
      forceStart: true,
    })
    const frame = new Uint8Array(3200)
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(frame.byteLength * 20))
        controller.close()
      },
    })

    const playback = lipSync.playPcm16Stream(stream, undefined, 16000)
    await readAheadLimitReached
    await Promise.resolve()

    expect(sourceNodes).toHaveLength(15)

    sourceNodes.slice(0, 5).forEach((source) => source.onended?.())
    await allScheduled
    sourceNodes.slice(5).forEach((source) => source.onended?.())
    await playback

    expect(sourceNodes).toHaveLength(20)
  })

  it('does not restart a pending stream after playback is stopped', async () => {
    const createBufferSource = jest.fn()
    const cancel = jest.fn()
    const audioContext = {
      state: 'suspended',
      currentTime: 0,
      destination: {},
      createAnalyser: jest.fn(() => ({
        getFloatTimeDomainData: jest.fn(),
      })),
      createBuffer: jest.fn(),
      createBufferSource,
      resume: jest.fn().mockResolvedValue(undefined),
    }
    const lipSync = new LipSync(audioContext as unknown as AudioContext)
    const playback = lipSync.playPcm16Stream(
      new ReadableStream<Uint8Array>({ cancel }),
      undefined,
      16000
    )

    await Promise.resolve()
    lipSync.stopCurrentPlayback()
    await playback
    window.dispatchEvent(new Event('click'))

    expect(createBufferSource).not.toHaveBeenCalled()
    expect(cancel).toHaveBeenCalledWith('playback superseded')
  })

  it('cancels a stream stopped before the audio context resumes', async () => {
    let finishResume!: () => void
    const resumed = new Promise<void>((resolve) => {
      finishResume = resolve
    })
    const context = {
      state: 'suspended',
      createAnalyser: jest.fn(),
      createBufferSource: jest.fn(),
      resume: jest.fn(() => resumed),
    }
    const cancel = jest.fn()
    const lipSync = new LipSync(context as unknown as AudioContext, {
      forceStart: true,
    })
    const playback = lipSync.playPcm16Stream(
      new ReadableStream<Uint8Array>({ cancel })
    )

    lipSync.stopCurrentPlayback()
    finishResume()
    await playback

    expect(context.createBufferSource).not.toHaveBeenCalled()
    expect(cancel).toHaveBeenCalledWith('playback superseded')
  })
})

describe('LipSync buffer playback', () => {
  it('calls onEnded once when a buffer finishes', async () => {
    const source = Object.assign(new EventTarget(), {
      buffer: null as AudioBuffer | null,
      connect: jest.fn(),
      start: jest.fn(),
      onended: null as (() => void) | null,
    })
    source.addEventListener('ended', () => source.onended?.())
    const context = {
      state: 'running',
      destination: {},
      createAnalyser: jest.fn(),
      createBufferSource: jest.fn(() => source),
      decodeAudioData: jest.fn(async () => ({}) as AudioBuffer),
    }
    const onEnded = jest.fn()
    const lipSync = new LipSync(context as unknown as AudioContext)

    await lipSync.playFromArrayBuffer(new ArrayBuffer(8), onEnded)
    source.dispatchEvent(new Event('ended'))

    expect(source.start).toHaveBeenCalledTimes(1)
    expect(onEnded).toHaveBeenCalledTimes(1)
  })

  it('settles an audio buffer stopped during decoding without starting it', async () => {
    let finishDecode!: (buffer: AudioBuffer) => void
    const onEnded = jest.fn()
    const context = {
      state: 'running',
      createAnalyser: jest.fn(),
      createBufferSource: jest.fn(),
      decodeAudioData: jest.fn(
        () =>
          new Promise<AudioBuffer>((resolve) => {
            finishDecode = resolve
          })
      ),
    }
    const lipSync = new LipSync(context as unknown as AudioContext)
    const playback = lipSync.playFromArrayBuffer(new ArrayBuffer(8), onEnded)
    await Promise.resolve()
    expect(context.decodeAudioData).toHaveBeenCalled()

    lipSync.stopCurrentPlayback()
    finishDecode({} as AudioBuffer)
    await playback

    expect(context.createBufferSource).not.toHaveBeenCalled()
    expect(onEnded).toHaveBeenCalledTimes(1)
  })
})
