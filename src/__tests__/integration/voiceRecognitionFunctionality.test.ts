/**
 * @jest-environment jsdom
 */
/**
 * 音声認識機能の統合テスト
 *
 * 音声認識フックのメモ化修正後も、既存の音声認識機能が
 * 正常に動作することを検証
 *
 * Requirements:
 * - 4.1: useBrowserSpeechRecognitionがブラウザ音声認識機能を正常に動作させる
 * - 4.2: useWhisperRecognitionがWhisper API経由の音声認識機能を正常に動作させる
 * - 4.3: useRealtimeVoiceAPIがリアルタイムAPI処理機能を正常に動作させる
 * - 4.4: Altキーが押された場合、音声認識を開始する
 * - 4.5: Altキーが離された場合、音声認識を停止しメッセージを送信する
 * - 4.6: 常時マイク入力モードが正常に動作する
 */

import { renderHook, act } from '@testing-library/react'

// Mock stores
const mockSettingsState = {
  selectLanguage: 'ja',
  speechRecognitionMode: 'browser',
  realtimeAPIMode: false,
  continuousMicListeningMode: false,
  initialSpeechTimeout: 5,
  noSpeechTimeout: 2,
}

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      return selector ? selector(mockSettingsState) : mockSettingsState
    }),
    {
      getState: jest.fn(() => mockSettingsState),
      setState: jest.fn((newState) => {
        Object.assign(mockSettingsState, newState)
      }),
    }
  ),
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      chatProcessing: false,
      isSpeaking: false,
    })),
    setState: jest.fn(),
  },
}))

jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      addToast: jest.fn(),
    })),
  },
}))

jest.mock('@/features/stores/websocketStore', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      wsManager: null,
    })),
  },
}))

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock SpeakQueue
jest.mock('@/features/messages/speakQueue', () => ({
  SpeakQueue: {
    stopAll: jest.fn(),
    onSpeakCompletion: jest.fn(),
    removeSpeakCompletionCallback: jest.fn(),
  },
}))

// Mock useSilenceDetection
jest.mock('@/hooks/useSilenceDetection', () => ({
  useSilenceDetection: jest.fn(() => ({
    silenceTimeoutRemaining: null,
    clearSilenceDetection: jest.fn(),
    startSilenceDetection: jest.fn(),
    updateSpeechTimestamp: jest.fn(),
    isSpeechEnded: jest.fn(() => false),
  })),
}))

// Mock useAudioProcessing
jest.mock('@/hooks/useAudioProcessing', () => ({
  useAudioProcessing: jest.fn(() => ({
    isRecording: false,
    audioContext: null,
    mediaRecorder: null,
    audioChunksRef: { current: [] },
    checkMicrophonePermission: jest.fn().mockResolvedValue(true),
    startRecording: jest.fn().mockResolvedValue(true),
    stopRecording: jest.fn().mockResolvedValue(new Blob()),
  })),
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

// navigator.mediaDevices.getUserMedia mock
const mockGetUserMedia = jest.fn().mockResolvedValue({
  getTracks: () => [{ stop: jest.fn() }],
})

describe('音声認識機能 統合テスト', () => {
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

    // 設定をリセット
    mockSettingsState.speechRecognitionMode = 'browser'
    mockSettingsState.realtimeAPIMode = false
    mockSettingsState.continuousMicListeningMode = false
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Req 4.1: ブラウザ音声認識機能', () => {
    it('startListeningでマイク権限確認と音声認識が開始される', async () => {
      const { useBrowserSpeechRecognition } = await import(
        '@/hooks/useBrowserSpeechRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 音声認識開始
      await act(async () => {
        await result.current.startListening()
        jest.runAllTimers()
      })

      // マイク権限確認が呼ばれた
      expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
      // 音声認識が開始された
      expect(mockSpeechRecognition.start).toHaveBeenCalled()
    })

    it('stopListeningで音声認識が停止される', async () => {
      const { useBrowserSpeechRecognition } = await import(
        '@/hooks/useBrowserSpeechRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 音声認識開始
      await act(async () => {
        await result.current.startListening()
        mockSpeechRecognition.onstart?.()
        jest.runAllTimers()
      })

      // 音声認識停止
      await act(async () => {
        await result.current.stopListening()
        jest.runAllTimers()
      })

      // 音声認識が停止された
      expect(mockSpeechRecognition.stop).toHaveBeenCalled()
    })

    it('handleInputChangeでuserMessageが更新される', async () => {
      const { useBrowserSpeechRecognition } = await import(
        '@/hooks/useBrowserSpeechRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 入力変更
      act(() => {
        result.current.handleInputChange({
          target: { value: 'テストメッセージ' },
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(result.current.userMessage).toBe('テストメッセージ')
    })

    it('handleSendMessageでonChatProcessStartが呼ばれる', async () => {
      const { useBrowserSpeechRecognition } = await import(
        '@/hooks/useBrowserSpeechRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 入力を設定
      act(() => {
        result.current.handleInputChange({
          target: { value: 'テストメッセージ' },
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      // メッセージ送信
      act(() => {
        result.current.handleSendMessage()
      })

      expect(mockOnChatProcessStart).toHaveBeenCalledWith('テストメッセージ')
    })
  })

  describe('Req 4.2: Whisper API音声認識機能', () => {
    it('startListeningで録音が開始される', async () => {
      const mockStartRecording = jest.fn().mockResolvedValue(true)
      jest.doMock('@/hooks/useAudioProcessing', () => ({
        useAudioProcessing: jest.fn(() => ({
          isRecording: false,
          startRecording: mockStartRecording,
          stopRecording: jest.fn().mockResolvedValue(new Blob()),
        })),
      }))

      const { useWhisperRecognition } = await import(
        '@/hooks/useWhisperRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 音声認識開始
      await act(async () => {
        await result.current.startListening()
        jest.runAllTimers()
      })

      // isListeningがtrueになることを確認
      expect(result.current.isListening).toBe(true)
    })

    it('toggleListeningでリスニング状態が切り替わる', async () => {
      const { useWhisperRecognition } = await import(
        '@/hooks/useWhisperRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 初期状態はfalse
      expect(result.current.isListening).toBe(false)

      // トグルで開始
      await act(async () => {
        result.current.toggleListening()
        jest.runAllTimers()
      })

      expect(result.current.isListening).toBe(true)
    })
  })

  describe('Req 4.3: リアルタイムAPI音声認識機能', () => {
    it('isWebSocketReadyが関数として存在する', async () => {
      const { useRealtimeVoiceAPI } = await import(
        '@/hooks/useRealtimeVoiceAPI'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useRealtimeVoiceAPI(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // isWebSocketReadyが関数として存在
      expect(typeof result.current.isWebSocketReady).toBe('function')
    })

    it('基本的な機能（handleInputChange, handleSendMessage）が動作する', async () => {
      const { useRealtimeVoiceAPI } = await import(
        '@/hooks/useRealtimeVoiceAPI'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useRealtimeVoiceAPI(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 初期状態を確認
      expect(result.current.isListening).toBe(false)
      expect(result.current.userMessage).toBe('')

      // handleInputChange呼び出し
      act(() => {
        result.current.handleInputChange({
          target: { value: 'テストメッセージ' },
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(result.current.userMessage).toBe('テストメッセージ')

      // handleSendMessage呼び出し
      act(() => {
        result.current.handleSendMessage()
      })

      expect(mockOnChatProcessStart).toHaveBeenCalledWith('テストメッセージ')
    })
  })

  describe('Req 4.4, 4.5: Altキーによる音声認識操作', () => {
    it('Altキー押下で音声認識が開始される', async () => {
      const { useVoiceRecognition } = await import(
        '@/hooks/useVoiceRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // Altキー押下イベント
      const keyDownEvent = new KeyboardEvent('keydown', { key: 'Alt' })
      await act(async () => {
        window.dispatchEvent(keyDownEvent)
        jest.runAllTimers()
      })

      // 音声認識が開始された
      expect(mockSpeechRecognition.start).toHaveBeenCalled()
    })

    it('Altキー離すと音声認識が停止される', async () => {
      const { useVoiceRecognition } = await import(
        '@/hooks/useVoiceRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // Altキー押下
      const keyDownEvent = new KeyboardEvent('keydown', { key: 'Alt' })
      await act(async () => {
        window.dispatchEvent(keyDownEvent)
        mockSpeechRecognition.onstart?.()
        jest.runAllTimers()
      })

      // Altキー離す
      const keyUpEvent = new KeyboardEvent('keyup', { key: 'Alt' })
      await act(async () => {
        window.dispatchEvent(keyUpEvent)
        jest.runAllTimers()
      })

      // 音声認識が停止された
      expect(mockSpeechRecognition.stop).toHaveBeenCalled()
    })
  })

  describe('Req 4.6: 常時マイク入力モード', () => {
    it('常時マイク入力モードがONで音声認識が自動開始される', async () => {
      // 常時マイク入力モードをONに設定
      mockSettingsState.continuousMicListeningMode = true

      const { useVoiceRecognition } = await import(
        '@/hooks/useVoiceRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      // マウント時のタイマー実行
      await act(async () => {
        jest.advanceTimersByTime(1500)
      })

      // 音声認識が自動開始された
      expect(mockSpeechRecognition.start).toHaveBeenCalled()
    })
  })

  describe('メモ化後も既存機能が維持される', () => {
    it('useMemo追加後もhandleInputChangeが正常に動作する', async () => {
      const { useBrowserSpeechRecognition } = await import(
        '@/hooks/useBrowserSpeechRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 入力変更
      act(() => {
        result.current.handleInputChange({
          target: { value: 'テスト1' },
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(result.current.userMessage).toBe('テスト1')

      // 再レンダリング
      rerender()

      // 再度入力変更
      act(() => {
        result.current.handleInputChange({
          target: { value: 'テスト2' },
        } as React.ChangeEvent<HTMLTextAreaElement>)
      })

      expect(result.current.userMessage).toBe('テスト2')
    })

    it('useMemo追加後もtoggleListeningが正常に動作する', async () => {
      const { useBrowserSpeechRecognition } = await import(
        '@/hooks/useBrowserSpeechRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      const { result, rerender } = renderHook(() =>
        useBrowserSpeechRecognition(mockOnChatProcessStart)
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // 初期状態
      expect(result.current.isListening).toBe(false)

      // 再レンダリング後もtoggleListeningが動作する
      rerender()

      await act(async () => {
        result.current.toggleListening()
        mockSpeechRecognition.onstart?.()
        jest.runAllTimers()
      })

      expect(result.current.isListening).toBe(true)
    })
  })
})
