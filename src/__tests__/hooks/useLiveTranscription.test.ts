/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { useLiveTranscription } from '@/hooks/useLiveTranscription'

const addToast = jest.fn()
const mockSettingsState = {
  selectLanguage: 'ja',
  openaiKey: 'sk-test',
  initialSpeechTimeout: 0,
  noSpeechTimeout: 0,
}

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => selector(mockSettingsState)),
    {
      getState: jest.fn(() => mockSettingsState),
    }
  ),
}))

jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: {
    getState: () => ({ addToast }),
  },
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: { setState: jest.fn() },
}))

jest.mock('@/features/messages/speakQueue', () => ({
  SpeakQueue: { stopAll: jest.fn() },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

class MockDataChannel extends EventTarget {
  readyState: RTCDataChannelState = 'open'
  send = jest.fn()
  close = jest.fn(() => {
    this.readyState = 'closed'
  })

  emitMessage(data: Record<string, unknown>) {
    this.dispatchEvent(
      new MessageEvent('message', { data: JSON.stringify(data) })
    )
  }
}

const dataChannel = new MockDataChannel()
const audioTrack = { enabled: true, stop: jest.fn() }
const mediaStream = {
  getAudioTracks: jest.fn(() => [audioTrack]),
  getTracks: jest.fn(() => [audioTrack]),
}

class MockPeerConnection {
  connectionState: RTCPeerConnectionState = 'connected'
  createDataChannel = jest.fn(() => dataChannel)
  addTrack = jest.fn()
  createOffer = jest.fn(async () => ({ type: 'offer', sdp: 'offer-sdp' }))
  setLocalDescription = jest.fn(async () => undefined)
  setRemoteDescription = jest.fn(async () => undefined)
  close = jest.fn()
}

describe('useLiveTranscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    dataChannel.readyState = 'open'
    audioTrack.enabled = true
    mockSettingsState.initialSpeechTimeout = 0
    mockSettingsState.noSpeechTimeout = 0

    Object.defineProperty(global, 'RTCPeerConnection', {
      configurable: true,
      value: MockPeerConnection,
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: jest.fn(async () => mediaStream),
      },
    })

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: 'ek_test' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'answer-sdp',
      }) as jest.Mock
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('WebRTCでdeltaを表示し、commit後の確定文字列をチャットへ送る', async () => {
    const onChatProcessStart = jest.fn()
    const { result } = renderHook(() =>
      useLiveTranscription(onChatProcessStart)
    )

    await act(async () => {
      await result.current.startListening()
    })

    expect(result.current.isListening).toBe(true)
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/ai/realtime-client-secret',
      expect.objectContaining({
        body: JSON.stringify({
          apiKey: 'sk-test',
          model: 'gpt-live-transcribe',
          sessionType: 'transcription',
          languages: ['ja'],
        }),
      })
    )

    act(() => {
      dataChannel.emitMessage({
        type: 'conversation.item.input_audio_transcription.delta',
        item_id: 'item_1',
        delta: 'こんにちは',
      })
    })
    expect(result.current.userMessage).toBe('こんにちは')

    await act(async () => {
      const stopPromise = result.current.stopListening()
      await Promise.resolve()
      dataChannel.emitMessage({
        type: 'conversation.item.input_audio_transcription.completed',
        item_id: 'item_1',
        transcript: 'こんにちは、マスター。',
      })
      await stopPromise
    })

    expect(dataChannel.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'input_audio_buffer.commit' })
    )
    expect(onChatProcessStart).toHaveBeenCalledWith('こんにちは、マスター。')
    expect(result.current.isListening).toBe(false)
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.userMessage).toBe('')
    expect(audioTrack.stop).toHaveBeenCalled()
  })

  it('一時トークンとマイクを並列に取得する', async () => {
    let resolveTokenResponse: (value: unknown) => void = () => undefined
    const tokenResponsePromise = new Promise((resolve) => {
      resolveTokenResponse = resolve
    })
    global.fetch = jest
      .fn()
      .mockReturnValueOnce(tokenResponsePromise)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => 'answer-sdp',
      }) as jest.Mock

    const onChatProcessStart = jest.fn()
    const { result } = renderHook(() =>
      useLiveTranscription(onChatProcessStart)
    )

    await act(async () => {
      const startPromise = result.current.startListening()
      await Promise.resolve()

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1)
      expect(result.current.isListening).toBe(false)

      resolveTokenResponse({
        ok: true,
        json: async () => ({ value: 'ek_parallel' }),
      })
      await startPromise
    })

    expect(result.current.isListening).toBe(true)
  })

  it('トークン取得に失敗した場合は並列取得済みのマイクを停止する', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid API key' }),
    }) as jest.Mock

    const onChatProcessStart = jest.fn()
    const { result } = renderHook(() =>
      useLiveTranscription(onChatProcessStart)
    )

    await act(async () => {
      await result.current.startListening()
    })

    expect(result.current.isListening).toBe(false)
    expect(audioTrack.stop).toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Toasts.LiveTranscriptionError' })
    )
  })

  it('文字起こし更新後の無音タイムアウトで自動送信する', async () => {
    jest.useFakeTimers()
    mockSettingsState.initialSpeechTimeout = 5
    mockSettingsState.noSpeechTimeout = 2
    const onChatProcessStart = jest.fn()
    const { result } = renderHook(() =>
      useLiveTranscription(onChatProcessStart)
    )

    await act(async () => {
      await result.current.startListening()
    })

    act(() => {
      dataChannel.emitMessage({
        type: 'conversation.item.input_audio_transcription.delta',
        item_id: 'item_vad',
        delta: '自動送信',
      })
    })
    expect(result.current.userMessage).toBe('自動送信')
    expect(result.current.silenceTimeoutRemaining).toBe(2000)

    await act(async () => {
      jest.advanceTimersByTime(2000)
      await Promise.resolve()
    })
    expect(dataChannel.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'input_audio_buffer.commit' })
    )

    await act(async () => {
      dataChannel.emitMessage({
        type: 'conversation.item.input_audio_transcription.completed',
        item_id: 'item_vad',
        transcript: '自動送信します。',
      })
      await Promise.resolve()
    })

    expect(onChatProcessStart).toHaveBeenCalledWith('自動送信します。')
    expect(result.current.isListening).toBe(false)
    expect(result.current.silenceTimeoutRemaining).toBeNull()
    expect(audioTrack.stop).toHaveBeenCalled()
  })

  it('最初の発話がない場合は設定時間後に接続を終了する', async () => {
    jest.useFakeTimers()
    mockSettingsState.initialSpeechTimeout = 1
    const onChatProcessStart = jest.fn()
    const { result } = renderHook(() =>
      useLiveTranscription(onChatProcessStart)
    )

    await act(async () => {
      await result.current.startListening()
    })

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(result.current.isListening).toBe(false)
    expect(onChatProcessStart).not.toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Toasts.NoSpeechDetected',
      })
    )
    expect(audioTrack.stop).toHaveBeenCalled()
  })
})
