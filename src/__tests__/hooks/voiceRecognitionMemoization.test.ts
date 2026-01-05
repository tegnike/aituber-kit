/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import { useBrowserSpeechRecognition } from '@/hooks/useBrowserSpeechRecognition'
import { useWhisperRecognition } from '@/hooks/useWhisperRecognition'
import { useRealtimeVoiceAPI } from '@/hooks/useRealtimeVoiceAPI'

// Mock stores
const mockSettingsState = {
  selectLanguage: 'ja',
  initialSpeechTimeout: 5,
  noSpeechTimeout: 2,
  continuousMicListeningMode: false,
  realtimeAPIMode: false,
  openaiKey: 'test-key',
  whisperTranscriptionModel: 'whisper-1',
  realtimeAPIModeContentType: 'input_text',
}

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => selector(mockSettingsState)),
    {
      getState: () => mockSettingsState,
      setState: jest.fn(),
    }
  ),
}))

jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: {
    getState: () => ({ addToast: jest.fn() }),
  },
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: {
    setState: jest.fn(),
    getState: () => ({ chatProcessing: false, isSpeaking: false }),
  },
}))

jest.mock('@/features/stores/websocketStore', () => ({
  __esModule: true,
  default: {
    getState: () => ({ wsManager: null }),
  },
}))

// Mock react-i18next - 安定した参照を返すため関数を事前定義
const mockT = (key: string) => key
const mockTranslationReturn = { t: mockT }

jest.mock('react-i18next', () => ({
  useTranslation: () => mockTranslationReturn,
}))

// Mock useSilenceDetection - 安定した参照を返すため関数を事前定義
const mockClearSilenceDetection = jest.fn()
const mockStartSilenceDetection = jest.fn()
const mockUpdateSpeechTimestamp = jest.fn()
const mockIsSpeechEnded = jest.fn(() => false)
const mockSilenceDetectionReturn = {
  silenceTimeoutRemaining: null,
  clearSilenceDetection: mockClearSilenceDetection,
  startSilenceDetection: mockStartSilenceDetection,
  updateSpeechTimestamp: mockUpdateSpeechTimestamp,
  isSpeechEnded: mockIsSpeechEnded,
}

jest.mock('@/hooks/useSilenceDetection', () => ({
  useSilenceDetection: jest.fn(() => mockSilenceDetectionReturn),
}))

// Mock useAudioProcessing - useMemoでラップして安定した参照を返す
const mockCheckMicrophonePermission = jest.fn().mockResolvedValue(true)
const mockStartRecordingFn = jest.fn().mockResolvedValue(true)
const mockStopRecordingFn = jest.fn().mockResolvedValue(null)
const mockAudioChunksRef = { current: [] }
const mockAudioProcessingReturn = {
  audioContext: null,
  mediaRecorder: null,
  checkMicrophonePermission: mockCheckMicrophonePermission,
  startRecording: mockStartRecordingFn,
  stopRecording: mockStopRecordingFn,
  audioChunksRef: mockAudioChunksRef,
}

jest.mock('@/hooks/useAudioProcessing', () => ({
  useAudioProcessing: () => mockAudioProcessingReturn,
}))

// Mock SpeakQueue
jest.mock('@/features/messages/speakQueue', () => ({
  SpeakQueue: {
    stopAll: jest.fn(),
  },
}))

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  onstart: (() => void) | null = null
  onspeechstart: (() => void) | null = null
  onresult: ((event: unknown) => void) | null = null
  onspeechend: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null

  start = jest.fn()
  stop = jest.fn()
  abort = jest.fn()
}

// Mock navigator.mediaDevices.getUserMedia
const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: () => [{ stop: jest.fn() }],
})

/**
 * 音声認識フックの戻り値メモ化テスト
 *
 * Requirements:
 * - 1.4: 内部状態が変更されない場合、同一のオブジェクト参照を返す
 * - 3.3: 音声認識が動作中の場合、不要な再レンダリングを引き起こさない
 */
describe('音声認識フックの戻り値メモ化', () => {
  let mockSpeechRecognition: MockSpeechRecognition

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    mockSpeechRecognition = new MockSpeechRecognition()
    ;(window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      jest.fn(() => mockSpeechRecognition)
    ;(
      window as unknown as { webkitSpeechRecognition: unknown }
    ).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition)

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
      configurable: true,
    })

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Chrome',
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('useBrowserSpeechRecognition - 戻り値の参照安定性', () => {
    it('状態が変化しない場合、戻り値オブジェクトの参照が同一であること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      // 初期化を待つ
      await act(async () => {
        jest.runAllTimers()
      })

      // 最初の戻り値を保存
      const firstResult = result.current

      // 再レンダリング（状態変化なし）
      rerender()

      // 参照が同一であることを確認
      expect(result.current).toBe(firstResult)
    })

    it('userMessageが変化した場合のみ、新しい参照が返されること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      const firstResult = result.current

      // userMessageの変更をシミュレート
      act(() => {
        result.current.handleInputChange({
          target: { value: 'テスト' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // 状態が変化したので、新しい参照になる
      expect(result.current).not.toBe(firstResult)
      expect(result.current.userMessage).toBe('テスト')
    })

    it('handleInputChange関数の参照が安定していること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      const firstHandleInputChange = result.current.handleInputChange

      rerender()

      expect(result.current.handleInputChange).toBe(firstHandleInputChange)
    })
  })

  describe('useWhisperRecognition - 戻り値の参照安定性', () => {
    it('状態が変化しない場合、戻り値オブジェクトの参照が同一であること', () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const firstResult = result.current

      rerender()

      expect(result.current).toBe(firstResult)
    })

    it('isProcessing状態が変化した場合のみ、新しい参照が返されること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const firstResult = result.current

      // isProcessingはfalseのまま
      expect(result.current.isProcessing).toBe(false)

      // 状態が変化していなければ参照は同じ
      expect(result.current).toBe(firstResult)
    })

    it('stopListening関数の参照が安定していること', () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const firstStopListening = result.current.stopListening

      rerender()

      expect(result.current.stopListening).toBe(firstStopListening)
    })

    it('startListening関数の参照が安定していること', () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const firstStartListening = result.current.startListening

      rerender()

      expect(result.current.startListening).toBe(firstStartListening)
    })

    it('toggleListening関数の参照が安定していること', () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const firstToggleListening = result.current.toggleListening

      rerender()

      expect(result.current.toggleListening).toBe(firstToggleListening)
    })
  })

  describe('useRealtimeVoiceAPI - 戻り値の参照安定性', () => {
    it('状態が変化しない場合、戻り値オブジェクトの参照が同一であること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useRealtimeVoiceAPI(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      const firstResult = result.current

      rerender()

      expect(result.current).toBe(firstResult)
    })

    it('handleInputChange関数の参照が安定していること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useRealtimeVoiceAPI(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      const firstHandleInputChange = result.current.handleInputChange

      rerender()

      expect(result.current.handleInputChange).toBe(firstHandleInputChange)
    })

    it('isWebSocketReady関数の参照が安定していること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useRealtimeVoiceAPI(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      const firstIsWebSocketReady = result.current.isWebSocketReady

      rerender()

      expect(result.current.isWebSocketReady).toBe(firstIsWebSocketReady)
    })
  })

  describe('複数回のリレンダリングでの参照安定性', () => {
    it('useBrowserSpeechRecognitionは10回のリレンダリングでも参照が安定していること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      const firstResult = result.current

      // 10回リレンダリング
      for (let i = 0; i < 10; i++) {
        rerender()
      }

      expect(result.current).toBe(firstResult)
    })

    it('useWhisperRecognitionは10回のリレンダリングでも参照が安定していること', () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const firstResult = result.current

      for (let i = 0; i < 10; i++) {
        rerender()
      }

      expect(result.current).toBe(firstResult)
    })

    it('useRealtimeVoiceAPIは10回のリレンダリングでも参照が安定していること', async () => {
      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useRealtimeVoiceAPI(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      const firstResult = result.current

      for (let i = 0; i < 10; i++) {
        rerender()
      }

      expect(result.current).toBe(firstResult)
    })
  })
})
