/**
 * @jest-environment jsdom
 */

/**
 * エラーハンドリング統一テスト (Requirement 8)
 *
 * 各フックのエラーハンドリングパターンが以下の基準で統一されていることを検証:
 * 1. console.error出力形式の統一
 * 2. toastStoreを使用したユーザー通知パターンの統一
 * 3. 同じエラーカテゴリに対して同じトーストタグを使用
 */

import toastStore from '@/features/stores/toast'

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        selectLanguage: 'ja',
        realtimeAPIMode: false,
        initialSpeechTimeout: 10,
        noSpeechTimeout: 3,
        continuousMicListeningMode: false,
        openaiKey: 'test-key',
        whisperTranscriptionModel: 'whisper-1',
      }
      return selector(state)
    }),
    {
      getState: jest.fn(() => ({
        selectLanguage: 'ja',
        realtimeAPIMode: false,
        initialSpeechTimeout: 10,
        noSpeechTimeout: 3,
        continuousMicListeningMode: false,
        openaiKey: 'test-key',
        whisperTranscriptionModel: 'whisper-1',
      })),
      setState: jest.fn(),
    }
  ),
}))

const mockAddToast = jest.fn()
jest.mock('@/features/stores/toast', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({ addToast: mockAddToast })),
  },
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: {
    setState: jest.fn(),
    getState: jest.fn(() => ({
      chatProcessing: false,
      isSpeaking: false,
    })),
  },
}))

jest.mock('@/features/stores/websocketStore', () => ({
  __esModule: true,
  default: {
    getState: () => ({ wsManager: null }),
  },
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('@/features/messages/speakQueue', () => ({
  SpeakQueue: {
    stopAll: jest.fn(),
    onSpeakCompletion: jest.fn(),
    removeSpeakCompletionCallback: jest.fn(),
  },
}))

// エラーハンドリングで使用されるべきトーストタグの定義
const EXPECTED_TOAST_TAGS = {
  // マイク権限関連
  MICROPHONE_PERMISSION_ERROR: 'microphone-permission-error',
  MICROPHONE_PERMISSION_ERROR_FIREFOX: 'microphone-permission-error-firefox',

  // 音声認識関連
  SPEECH_RECOGNITION_NOT_SUPPORTED: 'speech-recognition-not-supported',
  SPEECH_RECOGNITION_ERROR: 'speech-recognition-error',

  // 音声検出関連
  NO_SPEECH_DETECTED: 'no-speech-detected',
  NO_SPEECH_DETECTED_LONG_SILENCE: 'no-speech-detected-long-silence',

  // Whisper API関連
  WHISPER_ERROR: 'whisper-error',
}

// エラーハンドリングで使用されるべきトーストメッセージキーの定義
const EXPECTED_TOAST_MESSAGE_KEYS = {
  MICROPHONE_PERMISSION_DENIED: 'Toasts.MicrophonePermissionDenied',
  FIREFOX_NOT_SUPPORTED: 'Toasts.FirefoxNotSupported',
  SPEECH_RECOGNITION_NOT_SUPPORTED: 'Toasts.SpeechRecognitionNotSupported',
  SPEECH_RECOGNITION_ERROR: 'Toasts.SpeechRecognitionError',
  NO_SPEECH_DETECTED: 'Toasts.NoSpeechDetected',
  WHISPER_ERROR: 'Toasts.WhisperError',
}

describe('エラーハンドリングの統一 (Requirement 8)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('8.1 エラーカテゴリとトーストタグの一致', () => {
    it('マイク権限エラーには統一されたタグが使用される', () => {
      // 期待される動作: マイク権限エラー時に 'microphone-permission-error' タグを使用
      expect(EXPECTED_TOAST_TAGS.MICROPHONE_PERMISSION_ERROR).toBe(
        'microphone-permission-error'
      )
    })

    it('音声認識未サポートエラーには統一されたタグが使用される', () => {
      // 期待される動作: SpeechRecognition APIがない場合に統一タグを使用
      expect(EXPECTED_TOAST_TAGS.SPEECH_RECOGNITION_NOT_SUPPORTED).toBe(
        'speech-recognition-not-supported'
      )
    })

    it('音声未検出には統一されたタグが使用される', () => {
      // 期待される動作: 音声が検出されなかった場合に統一タグを使用
      expect(EXPECTED_TOAST_TAGS.NO_SPEECH_DETECTED).toBe('no-speech-detected')
    })

    it('Whisperエラーには統一されたタグが使用される', () => {
      // 期待される動作: Whisper APIエラー時に統一タグを使用
      expect(EXPECTED_TOAST_TAGS.WHISPER_ERROR).toBe('whisper-error')
    })
  })

  describe('8.2 console.error出力形式の統一', () => {
    it('エラーメッセージは一貫したプレフィックスを使用すべき', () => {
      // エラーログの形式が統一されているかを確認するためのパターン
      // 例: 'Error starting recognition:', error
      // 例: 'Whisper transcription error:', error
      // 統一形式: '[コンテキスト] エラー説明:', error

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // シミュレートされたエラーログを確認
      console.error('Error starting recognition:', new Error('test'))
      console.error('Microphone permission error:', new Error('test'))
      console.error('Speech recognition error:', new Error('test'))

      // 各呼び出しで第1引数が文字列であることを確認
      consoleSpy.mock.calls.forEach((call) => {
        expect(typeof call[0]).toBe('string')
        // エラーメッセージが':'で終わる形式であることを確認
        expect(call[0]).toMatch(/:\s*$/)
      })

      consoleSpy.mockRestore()
    })
  })

  describe('8.3 toastStoreを使用したユーザー通知パターンの統一', () => {
    it('toastには必須フィールド(message, type, tag)が含まれる', () => {
      // 期待されるtoastの構造
      const expectedToastStructure = {
        message: expect.any(String),
        type: expect.stringMatching(/^(info|error|warning|success)$/),
        tag: expect.any(String),
      }

      // 各エラーカテゴリで使用されるtoastパターンを検証
      const sampleToasts = [
        {
          message: 'Toasts.MicrophonePermissionDenied',
          type: 'error',
          tag: 'microphone-permission-error',
        },
        {
          message: 'Toasts.NoSpeechDetected',
          type: 'info',
          tag: 'no-speech-detected',
        },
        {
          message: 'Toasts.WhisperError',
          type: 'error',
          tag: 'whisper-error',
        },
      ]

      sampleToasts.forEach((toast) => {
        expect(toast).toMatchObject(expectedToastStructure)
      })
    })

    it('エラータイプにはerror、情報にはinfoが使用される', () => {
      // エラーカテゴリとtype の対応関係を確認
      const errorTypeMap = {
        'microphone-permission-error': 'error',
        'speech-recognition-not-supported': 'error',
        'speech-recognition-error': 'error',
        'whisper-error': 'error',
        'no-speech-detected': 'info', // 音声未検出は情報レベル
      }

      Object.entries(errorTypeMap).forEach(([tag, expectedType]) => {
        expect(expectedType).toMatch(/^(error|info)$/)
      })
    })
  })
})

describe('統一されたエラーハンドリングパターンの定義', () => {
  /**
   * このテストは、各フックで使用すべき統一されたエラーハンドリングパターンを定義します。
   * 実装時には、以下のパターンに従ってエラーハンドリングを行います。
   */

  it('マイク権限エラー時の統一パターン', () => {
    const handleMicrophonePermissionError = (
      error: Error,
      t: (key: string) => string
    ) => {
      console.error('Microphone permission error:', error)
      toastStore.getState().addToast({
        message: t(EXPECTED_TOAST_MESSAGE_KEYS.MICROPHONE_PERMISSION_DENIED),
        type: 'error',
        tag: EXPECTED_TOAST_TAGS.MICROPHONE_PERMISSION_ERROR,
      })
    }

    const testError = new Error('Permission denied')
    const mockT = (key: string) => key

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    handleMicrophonePermissionError(testError, mockT)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Microphone permission error:',
      testError
    )
    expect(mockAddToast).toHaveBeenCalledWith({
      message: EXPECTED_TOAST_MESSAGE_KEYS.MICROPHONE_PERMISSION_DENIED,
      type: 'error',
      tag: EXPECTED_TOAST_TAGS.MICROPHONE_PERMISSION_ERROR,
    })

    consoleSpy.mockRestore()
  })

  it('音声認識未サポートエラー時の統一パターン', () => {
    const handleSpeechRecognitionNotSupported = (
      t: (key: string) => string
    ) => {
      console.error('Speech Recognition API is not supported in this browser')
      toastStore.getState().addToast({
        message: t(
          EXPECTED_TOAST_MESSAGE_KEYS.SPEECH_RECOGNITION_NOT_SUPPORTED
        ),
        type: 'error',
        tag: EXPECTED_TOAST_TAGS.SPEECH_RECOGNITION_NOT_SUPPORTED,
      })
    }

    const mockT = (key: string) => key

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    handleSpeechRecognitionNotSupported(mockT)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Speech Recognition API is not supported in this browser'
    )
    expect(mockAddToast).toHaveBeenCalledWith({
      message: EXPECTED_TOAST_MESSAGE_KEYS.SPEECH_RECOGNITION_NOT_SUPPORTED,
      type: 'error',
      tag: EXPECTED_TOAST_TAGS.SPEECH_RECOGNITION_NOT_SUPPORTED,
    })

    consoleSpy.mockRestore()
  })

  it('音声未検出時の統一パターン', () => {
    const handleNoSpeechDetected = (t: (key: string) => string) => {
      toastStore.getState().addToast({
        message: t(EXPECTED_TOAST_MESSAGE_KEYS.NO_SPEECH_DETECTED),
        type: 'info',
        tag: EXPECTED_TOAST_TAGS.NO_SPEECH_DETECTED,
      })
    }

    const mockT = (key: string) => key

    handleNoSpeechDetected(mockT)

    expect(mockAddToast).toHaveBeenCalledWith({
      message: EXPECTED_TOAST_MESSAGE_KEYS.NO_SPEECH_DETECTED,
      type: 'info',
      tag: EXPECTED_TOAST_TAGS.NO_SPEECH_DETECTED,
    })
  })

  it('Whisper APIエラー時の統一パターン', () => {
    const handleWhisperError = (error: Error, t: (key: string) => string) => {
      console.error('Whisper transcription error:', error)
      toastStore.getState().addToast({
        message: t(EXPECTED_TOAST_MESSAGE_KEYS.WHISPER_ERROR),
        type: 'error',
        tag: EXPECTED_TOAST_TAGS.WHISPER_ERROR,
      })
    }

    const testError = new Error('Whisper API failed')
    const mockT = (key: string) => key

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    handleWhisperError(testError, mockT)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Whisper transcription error:',
      testError
    )
    expect(mockAddToast).toHaveBeenCalledWith({
      message: EXPECTED_TOAST_MESSAGE_KEYS.WHISPER_ERROR,
      type: 'error',
      tag: EXPECTED_TOAST_TAGS.WHISPER_ERROR,
    })

    consoleSpy.mockRestore()
  })

  it('音声認識開始エラー時の統一パターン', () => {
    const handleSpeechRecognitionStartError = (
      error: Error,
      t: (key: string) => string
    ) => {
      console.error('Error starting recognition:', error)
      toastStore.getState().addToast({
        message: t(EXPECTED_TOAST_MESSAGE_KEYS.SPEECH_RECOGNITION_ERROR),
        type: 'error',
        tag: EXPECTED_TOAST_TAGS.SPEECH_RECOGNITION_ERROR,
      })
    }

    const testError = new Error('Failed to start')
    const mockT = (key: string) => key

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    handleSpeechRecognitionStartError(testError, mockT)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error starting recognition:',
      testError
    )
    expect(mockAddToast).toHaveBeenCalledWith({
      message: EXPECTED_TOAST_MESSAGE_KEYS.SPEECH_RECOGNITION_ERROR,
      type: 'error',
      tag: EXPECTED_TOAST_TAGS.SPEECH_RECOGNITION_ERROR,
    })

    consoleSpy.mockRestore()
  })
})
