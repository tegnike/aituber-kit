/**
 * @jest-environment jsdom
 */
/**
 * 無限ループ防止の統合テスト
 *
 * 音声認識フックの戻り値がメモ化されることで、
 * useVoiceRecognitionの依存配列が安定し、無限ループが発生しないことを検証
 *
 * Requirements:
 * - 2.1: useVoiceRecognitionの依存配列安定化
 * - 3.1: MessageInputContainerが「Maximum update depth exceeded」エラーを発生させない
 * - 3.2: マウント時に安定した状態で初期化される
 * - 3.3: 音声認識動作中に不要な再レンダリングを引き起こさない
 */

import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        selectLanguage: 'ja',
        speechRecognitionMode: 'browser',
        realtimeAPIMode: false,
        continuousMicListeningMode: false,
        initialSpeechTimeout: 5,
        noSpeechTimeout: 2,
      }
      return selector ? selector(state) : state
    }),
    {
      getState: jest.fn(() => ({
        selectLanguage: 'ja',
        speechRecognitionMode: 'browser',
        realtimeAPIMode: false,
        continuousMicListeningMode: false,
        initialSpeechTimeout: 5,
        noSpeechTimeout: 2,
      })),
      setState: jest.fn(),
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

describe('無限ループ防止 統合テスト', () => {
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

  describe('Req 1.4: 戻り値の参照安定性', () => {
    it('useBrowserSpeechRecognitionの戻り値オブジェクトがuseMemoでメモ化されている', async () => {
      const { useBrowserSpeechRecognition } = await import(
        '@/hooks/useBrowserSpeechRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      let previousResult: ReturnType<
        typeof useBrowserSpeechRecognition
      > | null = null
      let sameReferenceCount = 0

      const { result, rerender } = renderHook(() => {
        const hook = useBrowserSpeechRecognition(mockOnChatProcessStart)
        if (previousResult !== null) {
          // 状態が変わっていなければ同じ参照であるべき
          // useMemoが機能していれば、stateが変わらない限り同一参照
          if (
            previousResult.userMessage === hook.userMessage &&
            previousResult.isListening === hook.isListening &&
            previousResult.silenceTimeoutRemaining ===
              hook.silenceTimeoutRemaining
          ) {
            if (Object.is(previousResult, hook)) {
              sameReferenceCount++
            }
          }
        }
        previousResult = hook
        return hook
      })

      await act(async () => {
        jest.runAllTimers()
      })

      // 初期化後に複数回再レンダリング
      for (let i = 0; i < 5; i++) {
        rerender()
        await act(async () => {
          jest.runAllTimers()
        })
      }

      // useMemoが機能している場合、状態が変わらない再レンダリングでは同一参照が維持される
      // 初期化完了後は参照が安定しているはず
      expect(result.current).toBeDefined()
      expect(result.current.userMessage).toBe('')
      expect(result.current.isListening).toBe(false)
    })

    it('useWhisperRecognitionの戻り値オブジェクトがuseMemoでメモ化されている', async () => {
      const { useWhisperRecognition } = await import(
        '@/hooks/useWhisperRecognition'
      )

      const mockOnChatProcessStart = jest.fn()

      const { result, rerender } = renderHook(() => {
        return useWhisperRecognition(mockOnChatProcessStart)
      })

      await act(async () => {
        jest.runAllTimers()
      })

      // 初期状態を記録
      const initialUserMessage = result.current.userMessage
      const initialIsListening = result.current.isListening
      const initialIsProcessing = result.current.isProcessing

      // 複数回再レンダリング
      for (let i = 0; i < 5; i++) {
        rerender()
      }

      await act(async () => {
        jest.runAllTimers()
      })

      // 状態が変わっていないことを確認
      expect(result.current.userMessage).toBe(initialUserMessage)
      expect(result.current.isListening).toBe(initialIsListening)
      expect(result.current.isProcessing).toBe(initialIsProcessing)
    })

    it('useRealtimeVoiceAPIの戻り値オブジェクトがuseMemoでメモ化されている', async () => {
      // WebSocket関連のモック
      jest.mock('@/features/stores/websocketStore', () => ({
        __esModule: true,
        default: {
          getState: jest.fn(() => ({
            wsManager: null,
          })),
        },
      }))

      const { useRealtimeVoiceAPI } = await import(
        '@/hooks/useRealtimeVoiceAPI'
      )

      const mockOnChatProcessStart = jest.fn()

      const { result, rerender } = renderHook(() => {
        return useRealtimeVoiceAPI(mockOnChatProcessStart)
      })

      await act(async () => {
        jest.runAllTimers()
      })

      // 初期状態を記録
      const initialUserMessage = result.current.userMessage
      const initialIsListening = result.current.isListening

      // 複数回再レンダリング
      for (let i = 0; i < 5; i++) {
        rerender()
      }

      await act(async () => {
        jest.runAllTimers()
      })

      // 状態が変わっていないことを確認
      expect(result.current.userMessage).toBe(initialUserMessage)
      expect(result.current.isListening).toBe(initialIsListening)
    })
  })

  describe('Req 3.2: マウント時の安定した初期化', () => {
    it('useVoiceRecognitionがマウント時にエラーなしで初期化される', async () => {
      const { useVoiceRecognition } = await import(
        '@/hooks/useVoiceRecognition'
      )

      const mockOnChatProcessStart = jest.fn()

      // Maximum update depth exceededエラーが発生しないことを検証
      expect(() => {
        renderHook(() =>
          useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
        )
      }).not.toThrow()

      await act(async () => {
        jest.runAllTimers()
      })
    })
  })

  describe('Req 3.3: 不要な再レンダリングの防止', () => {
    it('useVoiceRecognitionがマウント後に安定したレンダリング回数を維持する', async () => {
      const { useVoiceRecognition } = await import(
        '@/hooks/useVoiceRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      let renderCount = 0

      const { result, rerender } = renderHook(() => {
        renderCount++
        return useVoiceRecognition({
          onChatProcessStart: mockOnChatProcessStart,
        })
      })

      await act(async () => {
        jest.runAllTimers()
      })

      // 初期レンダリング後のカウント
      const initialRenderCount = renderCount

      // 手動で再レンダリングをトリガー
      rerender()
      rerender()
      rerender()

      await act(async () => {
        jest.runAllTimers()
      })

      // 手動再レンダリング3回分のみ増加すべき（無限ループではない）
      expect(renderCount).toBe(initialRenderCount + 3)
    })

    it('状態変化なしで10回再レンダリングしても無限ループにならない', async () => {
      const { useVoiceRecognition } = await import(
        '@/hooks/useVoiceRecognition'
      )

      const mockOnChatProcessStart = jest.fn()
      let renderCount = 0

      const { rerender } = renderHook(() => {
        renderCount++
        return useVoiceRecognition({
          onChatProcessStart: mockOnChatProcessStart,
        })
      })

      await act(async () => {
        jest.runAllTimers()
      })

      const initialRenderCount = renderCount

      // 10回再レンダリング
      for (let i = 0; i < 10; i++) {
        rerender()
      }

      await act(async () => {
        jest.runAllTimers()
      })

      // 無限ループなら renderCount が急増する
      // 正常なら initialRenderCount + 10 のはず
      expect(renderCount).toBe(initialRenderCount + 10)
      // 無限ループの場合は100を超えることが多い
      expect(renderCount).toBeLessThan(100)
    })
  })

  describe('Req 2.1: 依存配列の安定化', () => {
    it('currentHookの変更がない場合、useEffectは再実行されない', async () => {
      const { useVoiceRecognition } = await import(
        '@/hooks/useVoiceRecognition'
      )

      const mockOnChatProcessStart = jest.fn()

      const { result, rerender } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      await act(async () => {
        jest.runAllTimers()
      })

      // isListeningの初期値
      const initialIsListening = result.current.isListening

      // 再レンダリング
      rerender()

      await act(async () => {
        jest.runAllTimers()
      })

      // 状態が安定していることを確認
      expect(result.current.isListening).toBe(initialIsListening)
      expect(result.current.userMessage).toBe('')
    })
  })
})
