/**
 * Voice Recognition Functionality Integration Tests
 *
 * 認識開始→送信→AI応答→再開フローのテスト
 */

import { renderHook, act } from '@testing-library/react'

// Mock sub-hooks
const mockStartListening = jest.fn()
const mockStopListening = jest.fn()
const mockHandleInputChange = jest.fn()
const mockHandleSendMessage = jest.fn()
const mockToggleListening = jest.fn()

jest.mock('@/hooks/useBrowserSpeechRecognition', () => ({
  useBrowserSpeechRecognition: jest.fn(() => ({
    userMessage: '',
    isListening: false,
    silenceTimeoutRemaining: null,
    handleInputChange: mockHandleInputChange,
    handleSendMessage: mockHandleSendMessage,
    toggleListening: mockToggleListening,
    startListening: mockStartListening,
    stopListening: mockStopListening,
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
import homeStore from '@/features/stores/home'
import { SpeakQueue } from '@/features/messages/speakQueue'

describe('Voice Recognition Functionality Integration', () => {
  const mockOnChatProcessStart = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic flow', () => {
    it('should provide startListening and stopListening functions', () => {
      const { result } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      expect(typeof result.current.startListening).toBe('function')
      expect(typeof result.current.stopListening).toBe('function')
    })

    it('should provide toggleListening function', () => {
      const { result } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      expect(typeof result.current.toggleListening).toBe('function')
    })

    it('should provide handleSendMessage function', () => {
      const { result } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      expect(typeof result.current.handleSendMessage).toBe('function')
    })
  })

  describe('stop speaking flow', () => {
    it('should stop speaking and clear speak queue', () => {
      const { result } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      act(() => {
        result.current.handleStopSpeaking()
      })

      expect(homeStore.setState).toHaveBeenCalledWith({ isSpeaking: false })
      expect(SpeakQueue.stopAll).toHaveBeenCalled()
    })
  })

  describe('speech recognition mode selection', () => {
    it('should use browser recognition in browser mode', () => {
      const { result } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      // In browser mode, the hook should use browser speech recognition functions
      expect(result.current.handleInputChange).toBe(mockHandleInputChange)
    })
  })

  describe('initial state', () => {
    it('should start with isListening as false', () => {
      const { result } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      expect(result.current.isListening).toBe(false)
    })

    it('should start with empty userMessage', () => {
      const { result } = renderHook(() =>
        useVoiceRecognition({ onChatProcessStart: mockOnChatProcessStart })
      )

      expect(result.current.userMessage).toBe('')
    })
  })
})
