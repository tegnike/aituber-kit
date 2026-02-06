/**
 * Voice Recognition Memoization Tests
 *
 * 音声認識フック群のuseCallback/useMemoの安定性テスト
 */

import { renderHook } from '@testing-library/react'

// Mock all sub-hooks before importing
const mockBrowserStartListening = jest.fn()
const mockBrowserStopListening = jest.fn()
const mockBrowserHandleInputChange = jest.fn()
const mockBrowserHandleSendMessage = jest.fn()
const mockBrowserToggleListening = jest.fn()

jest.mock('@/hooks/useBrowserSpeechRecognition', () => ({
  useBrowserSpeechRecognition: jest.fn(() => ({
    userMessage: '',
    isListening: false,
    silenceTimeoutRemaining: null,
    handleInputChange: mockBrowserHandleInputChange,
    handleSendMessage: mockBrowserHandleSendMessage,
    toggleListening: mockBrowserToggleListening,
    startListening: mockBrowserStartListening,
    stopListening: mockBrowserStopListening,
    checkRecognitionActive: jest.fn(() => true),
  })),
}))

jest.mock('@/hooks/useWhisperRecognition', () => ({
  useWhisperRecognition: jest.fn(() => ({
    userMessage: '',
    isListening: false,
    isProcessing: false,
    silenceTimeoutRemaining: null,
    handleInputChange: jest.fn(),
    handleSendMessage: jest.fn(),
    toggleListening: jest.fn(),
    startListening: jest.fn(),
    stopListening: jest.fn(),
  })),
}))

jest.mock('@/hooks/useRealtimeVoiceAPI', () => ({
  useRealtimeVoiceAPI: jest.fn(() => ({
    userMessage: '',
    isListening: false,
    silenceTimeoutRemaining: null,
    handleInputChange: jest.fn(),
    handleSendMessage: jest.fn(),
    toggleListening: jest.fn(),
    startListening: jest.fn(),
    stopListening: jest.fn(),
  })),
}))

jest.mock('@/hooks/useIsomorphicLayoutEffect', () => ({
  useIsomorphicLayoutEffect: jest.fn((fn) => fn()),
}))

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        speechRecognitionMode: 'browser',
        realtimeAPIMode: false,
        continuousMicListeningMode: false,
      }
      return selector(state as any)
    }),
    {
      getState: jest.fn(() => ({
        speechRecognitionMode: 'browser',
        realtimeAPIMode: false,
        continuousMicListeningMode: false,
      })),
      setState: jest.fn(),
    }
  ),
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    getState: jest.fn(() => ({
      isSpeaking: false,
      chatProcessing: false,
    })),
    setState: jest.fn(),
  }),
}))

jest.mock('@/features/messages/speakQueue', () => ({
  SpeakQueue: {
    stopAll: jest.fn(),
    onSpeakCompletion: jest.fn(),
    removeSpeakCompletionCallback: jest.fn(),
  },
}))

import { useVoiceRecognition } from '@/hooks/useVoiceRecognition'

describe('Voice Recognition Memoization', () => {
  const mockOnChatProcessStart = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return stable function references across re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
    )

    const firstHandleStopSpeaking = result.current.handleStopSpeaking

    rerender()

    // handleStopSpeaking should be memoized via useCallback
    expect(result.current.handleStopSpeaking).toBe(firstHandleStopSpeaking)
  })

  it('should provide all expected interface properties', () => {
    const { result } = renderHook(() =>
      useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
    )

    expect(result.current).toHaveProperty('userMessage')
    expect(result.current).toHaveProperty('isListening')
    expect(result.current).toHaveProperty('isProcessing')
    expect(result.current).toHaveProperty('silenceTimeoutRemaining')
    expect(result.current).toHaveProperty('handleInputChange')
    expect(result.current).toHaveProperty('handleSendMessage')
    expect(result.current).toHaveProperty('toggleListening')
    expect(result.current).toHaveProperty('handleStopSpeaking')
    expect(result.current).toHaveProperty('startListening')
    expect(result.current).toHaveProperty('stopListening')
  })

  it('should default isProcessing to false when hook does not provide it', () => {
    const { result } = renderHook(() =>
      useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
    )

    expect(result.current.isProcessing).toBe(false)
  })
})
