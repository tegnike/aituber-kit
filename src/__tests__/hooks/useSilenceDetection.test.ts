/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSilenceDetection } from '@/hooks/useSilenceDetection'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({
      noSpeechTimeout: 2,
      initialSpeechTimeout: 5,
      continuousMicListeningMode: false,
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

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('useSilenceDetection', () => {
  const mockOnTextDetected = jest.fn()
  const mockSetUserMessage = jest.fn()
  const mockTranscriptRef = { current: '' }
  const mockSpeechDetectedRef = { current: false }

  const defaultProps = {
    onTextDetected: mockOnTextDetected,
    transcriptRef: mockTranscriptRef,
    setUserMessage: mockSetUserMessage,
    speechDetectedRef: mockSpeechDetectedRef,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockTranscriptRef.current = ''
    mockSpeechDetectedRef.current = false
    ;(settingsStore.getState as jest.Mock).mockReturnValue({
      noSpeechTimeout: 2,
      initialSpeechTimeout: 5,
      continuousMicListeningMode: false,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('無音検出の二重停止防止 (Requirement 3)', () => {
    it('3.1: stopListeningFnを呼び出す前にインターバルがクリアされる', async () => {
      const mockStopListening = jest.fn().mockImplementation(() => {
        return new Promise<void>((resolve) => {
          // 停止処理に時間がかかるシミュレーション
          setTimeout(resolve, 100)
        })
      })

      const { result } = renderHook(() => useSilenceDetection(defaultProps))

      // テキストを設定
      mockTranscriptRef.current = 'テスト音声'
      mockSpeechDetectedRef.current = true

      // 無音検出を開始
      act(() => {
        result.current.startSilenceDetection(mockStopListening)
      })

      // 無音タイムアウトを超える時間を経過させる
      act(() => {
        jest.advanceTimersByTime(2500) // 2.5秒後（noSpeechTimeout=2秒を超過）
      })

      // stopListeningFnが呼ばれた
      await waitFor(() => {
        expect(mockStopListening).toHaveBeenCalledTimes(1)
      })

      // さらに時間を経過させても、インターバルがクリアされているため
      // 追加のstopListening呼び出しは発生しない
      act(() => {
        jest.advanceTimersByTime(500)
      })

      // 依然として1回のみ
      expect(mockStopListening).toHaveBeenCalledTimes(1)
    })

    it('3.2: stopListeningFnが実行中でも追加の呼び出しがブロックされる', async () => {
      let resolveStopListening: () => void
      const mockStopListening = jest.fn().mockImplementation(() => {
        return new Promise<void>((resolve) => {
          resolveStopListening = resolve
        })
      })

      const { result } = renderHook(() => useSilenceDetection(defaultProps))

      // テキストを設定
      mockTranscriptRef.current = 'テスト音声'
      mockSpeechDetectedRef.current = true

      // 無音検出を開始
      act(() => {
        result.current.startSilenceDetection(mockStopListening)
      })

      // 無音タイムアウトを超える時間を経過させる
      act(() => {
        jest.advanceTimersByTime(2100)
      })

      // stopListeningFnが呼び出された
      expect(mockStopListening).toHaveBeenCalledTimes(1)

      // stopListeningがまだ完了していない状態で追加のインターバルが実行されても
      // 追加の呼び出しは発生しない
      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockStopListening).toHaveBeenCalledTimes(1)

      // stopListeningを完了させる
      act(() => {
        resolveStopListening!()
      })

      // 完了後も追加の呼び出しは発生しない
      act(() => {
        jest.advanceTimersByTime(200)
      })

      expect(mockStopListening).toHaveBeenCalledTimes(1)
    })

    it('3.3: speechEndedRefフラグにより重複実行が確実に防止される', async () => {
      const mockStopListening = jest.fn().mockResolvedValue(undefined)

      const { result } = renderHook(() => useSilenceDetection(defaultProps))

      // テキストを設定
      mockTranscriptRef.current = 'テスト音声'
      mockSpeechDetectedRef.current = true

      // 無音検出を開始
      act(() => {
        result.current.startSilenceDetection(mockStopListening)
      })

      // 無音タイムアウトを超える時間を経過させる
      act(() => {
        jest.advanceTimersByTime(2100)
      })

      // 最初の呼び出し
      await waitFor(() => {
        expect(mockStopListening).toHaveBeenCalledTimes(1)
      })

      // isSpeechEndedがtrueになっていることを確認
      expect(result.current.isSpeechEnded()).toBe(true)

      // さらに時間が経過しても重複呼び出しは発生しない
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockStopListening).toHaveBeenCalledTimes(1)
      expect(mockOnTextDetected).toHaveBeenCalledTimes(1)
      expect(mockOnTextDetected).toHaveBeenCalledWith('テスト音声')
    })

    it('長時間無音検出時もインターバルクリアが先に実行される', async () => {
      const mockStopListening = jest.fn().mockImplementation(() => {
        return new Promise<void>((resolve) => {
          setTimeout(resolve, 100)
        })
      })

      // 初期発話タイムアウトを設定
      ;(settingsStore.getState as jest.Mock).mockReturnValue({
        noSpeechTimeout: 2,
        initialSpeechTimeout: 3,
        continuousMicListeningMode: true,
      })

      const { result } = renderHook(() => useSilenceDetection(defaultProps))

      // speechDetectedRefはfalse（音声が検出されていない状態）
      mockSpeechDetectedRef.current = false

      // 無音検出を開始
      act(() => {
        result.current.startSilenceDetection(mockStopListening)
      })

      // 初期発話タイムアウトを超える時間を経過させる
      act(() => {
        jest.advanceTimersByTime(3100) // 3.1秒後
      })

      // stopListeningFnが呼ばれた
      await waitFor(() => {
        expect(mockStopListening).toHaveBeenCalledTimes(1)
      })

      // さらに時間を経過させても追加の呼び出しは発生しない
      act(() => {
        jest.advanceTimersByTime(500)
      })

      expect(mockStopListening).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearSilenceDetection', () => {
    it('インターバルが正しくクリアされる', () => {
      const mockStopListening = jest.fn().mockResolvedValue(undefined)

      const { result } = renderHook(() => useSilenceDetection(defaultProps))

      // 無音検出を開始
      act(() => {
        result.current.startSilenceDetection(mockStopListening)
      })

      // clearSilenceDetectionを呼び出し
      act(() => {
        result.current.clearSilenceDetection()
      })

      // タイムアウト時間を経過させる
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      // インターバルがクリアされているため、stopListeningは呼ばれない
      expect(mockStopListening).not.toHaveBeenCalled()
    })
  })
})
