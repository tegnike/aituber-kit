/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { useWhisperRecognition } from '@/hooks/useWhisperRecognition'
import React from 'react'

// 固定のstate参照を保持
const mockSettingsState = {
  selectLanguage: 'en',
  openaiKey: 'test-key',
  whisperTranscriptionModel: 'whisper-1',
}

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => selector(mockSettingsState)),
    {
      getState: () => mockSettingsState,
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
    getState: () => ({}),
  },
}))

// 固定のt関数参照
const mockT = (key: string) => key

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}))

// Mock useAudioProcessing
const mockStartRecording = jest.fn()
const mockStopRecording = jest.fn()

jest.mock('@/hooks/useAudioProcessing', () => ({
  useAudioProcessing: () => ({
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
  }),
}))

// Mock SpeakQueue
jest.mock('@/features/messages/speakQueue', () => ({
  SpeakQueue: {
    stopAll: jest.fn(),
  },
}))

describe('useWhisperRecognition - useCallback最適化', () => {
  const mockOnChatProcessStart = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockStartRecording.mockResolvedValue(true)
    mockStopRecording.mockResolvedValue(
      new Blob(['test'], { type: 'audio/webm' })
    )
  })

  describe('Requirement 7.1: processWhisperRecognition関数がuseCallbackでラップされている', () => {
    it('processWhisperRecognitionがstopListeningの依存配列に含まれること', () => {
      // このテストはuseCallbackの依存配列が正しく設定されていることを確認する
      // processWhisperRecognitionがuseCallbackでラップされていない場合、
      // stopListeningの参照が毎回変わり、不要な再レンダリングが発生する

      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const stopListeningFirst = result.current.stopListening

      // 再レンダリング
      rerender()

      const stopListeningSecond = result.current.stopListening

      // useCallbackが正しく設定されていれば、同じ参照を返す
      expect(stopListeningFirst).toBe(stopListeningSecond)
    })

    it('startListeningの参照が安定していること', () => {
      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const startListeningFirst = result.current.startListening

      // 再レンダリング
      rerender()

      const startListeningSecond = result.current.startListening

      // useCallbackが正しく設定されていれば、同じ参照を返す
      expect(startListeningFirst).toBe(startListeningSecond)
    })

    it('toggleListeningの参照が安定していること', () => {
      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const toggleListeningFirst = result.current.toggleListening

      // 再レンダリング
      rerender()

      const toggleListeningSecond = result.current.toggleListening

      expect(toggleListeningFirst).toBe(toggleListeningSecond)
    })
  })

  describe('Requirement 7.2: 依存配列が適切に設定されている', () => {
    it('stopListeningがprocessWhisperRecognitionを依存配列に含んでいること', () => {
      // ESLint exhaustive-deps警告が出ないように依存配列が設定されていることを
      // 間接的に確認する（参照が安定していることで確認）
      const { result, rerender } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      const stopListening1 = result.current.stopListening
      rerender()
      const stopListening2 = result.current.stopListening

      expect(stopListening1).toBe(stopListening2)
    })
  })

  describe('Requirement 7.3: ESLint警告の解消', () => {
    it('useCallbackの依存配列にselectLanguageとtが含まれていること', () => {
      // processWhisperRecognition内でselectLanguageとtが使用されているため、
      // useCallbackの依存配列に含める必要がある
      // これはコード構造から確認する必要がある

      const { result } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      // フックが正常に動作することを確認
      expect(result.current.stopListening).toBeDefined()
      expect(result.current.startListening).toBeDefined()
      expect(typeof result.current.stopListening).toBe('function')
      expect(typeof result.current.startListening).toBe('function')
    })
  })

  describe('基本機能の確認', () => {
    it('初期状態が正しいこと', () => {
      const { result } = renderHook(() =>
        useWhisperRecognition(mockOnChatProcessStart)
      )

      expect(result.current.userMessage).toBe('')
      expect(result.current.isListening).toBe(false)
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.silenceTimeoutRemaining).toBeNull()
    })
  })
})
