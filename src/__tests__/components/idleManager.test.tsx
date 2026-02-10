/**
 * IdleManager Component Tests
 *
 * アイドルモード管理コンポーネントのテスト
 * Requirements: 4.1, 5.3, 6.1
 */

import React from 'react'
import { render, act } from '@testing-library/react'
import IdleManager from '@/components/idleManager'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'

// Mock useIdleMode hook
const mockResetTimer = jest.fn()
const mockStopIdleSpeech = jest.fn()

jest.mock('@/hooks/useIdleMode', () => ({
  useIdleMode: jest.fn(() => ({
    isIdleActive: false,
    idleState: 'waiting',
    resetTimer: mockResetTimer,
    stopIdleSpeech: mockStopIdleSpeech,
    secondsUntilNextSpeech: 30,
  })),
}))

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/features/stores/home', () => {
  const getStateMock = jest.fn(() => ({
    chatLog: [],
    chatProcessingCount: 0,
    isSpeaking: false,
    presenceState: 'idle',
  }))
  const subscribeMock = jest.fn(() => jest.fn())

  return {
    __esModule: true,
    default: Object.assign(jest.fn(), {
      getState: getStateMock,
      subscribe: subscribeMock,
    }),
  }
})

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
>

// Import useIdleMode for mocking
import { useIdleMode } from '@/hooks/useIdleMode'
const mockUseIdleMode = useIdleMode as jest.MockedFunction<typeof useIdleMode>

describe('IdleManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: idle mode disabled
    mockSettingsStore.mockImplementation((selector) => {
      const state = { idleModeEnabled: false }
      return selector(state as any)
    })
  })

  describe('visibility', () => {
    it('should not render indicator when idle mode is disabled', () => {
      mockUseIdleMode.mockReturnValue({
        isIdleActive: false,
        idleState: 'disabled',
        resetTimer: mockResetTimer,
        stopIdleSpeech: mockStopIdleSpeech,
        secondsUntilNextSpeech: 30,
      })

      const { container } = render(<IdleManager />)
      expect(
        container.querySelector('[data-testid="idle-indicator"]')
      ).toBeNull()
    })

    it('should render indicator when idle mode is enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { idleModeEnabled: true }
        return selector(state as any)
      })
      mockUseIdleMode.mockReturnValue({
        isIdleActive: true,
        idleState: 'waiting',
        resetTimer: mockResetTimer,
        stopIdleSpeech: mockStopIdleSpeech,
        secondsUntilNextSpeech: 30,
      })

      const { container } = render(<IdleManager />)
      expect(
        container.querySelector('[data-testid="idle-indicator"]')
      ).not.toBeNull()
    })
  })

  describe('state display', () => {
    beforeEach(() => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { idleModeEnabled: true }
        return selector(state as any)
      })
    })

    it('should display waiting state correctly', () => {
      mockUseIdleMode.mockReturnValue({
        isIdleActive: true,
        idleState: 'waiting',
        resetTimer: mockResetTimer,
        stopIdleSpeech: mockStopIdleSpeech,
        secondsUntilNextSpeech: 25,
      })

      const { container } = render(<IdleManager />)
      const indicator = container.querySelector(
        '[data-testid="idle-indicator-dot"]'
      )
      expect(indicator).toHaveClass('bg-yellow-500')
    })

    it('should display speaking state correctly', () => {
      mockUseIdleMode.mockReturnValue({
        isIdleActive: true,
        idleState: 'speaking',
        resetTimer: mockResetTimer,
        stopIdleSpeech: mockStopIdleSpeech,
        secondsUntilNextSpeech: 30,
      })

      const { container } = render(<IdleManager />)
      const indicator = container.querySelector(
        '[data-testid="idle-indicator-dot"]'
      )
      expect(indicator).toHaveClass('bg-green-500')
    })
  })

  describe('countdown display', () => {
    beforeEach(() => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { idleModeEnabled: true }
        return selector(state as any)
      })
    })

    it('should display countdown in waiting state', () => {
      mockUseIdleMode.mockReturnValue({
        isIdleActive: true,
        idleState: 'waiting',
        resetTimer: mockResetTimer,
        stopIdleSpeech: mockStopIdleSpeech,
        secondsUntilNextSpeech: 15,
      })

      const { container } = render(<IdleManager />)
      const countdown = container.querySelector(
        '[data-testid="idle-countdown"]'
      )
      expect(countdown).toHaveTextContent('15')
    })
  })

  describe('hook integration', () => {
    it('should call useIdleMode with correct callbacks', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { idleModeEnabled: true }
        return selector(state as any)
      })

      render(<IdleManager />)

      // useIdleMode should be called
      expect(mockUseIdleMode).toHaveBeenCalled()
    })
  })
})
