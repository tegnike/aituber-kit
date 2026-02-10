/**
 * PresenceIndicator Component Tests
 *
 * 状態インジケーターコンポーネントのテスト
 * Requirements: 5.1, 5.2
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import PresenceIndicator from '@/components/presenceIndicator'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { PresenceState } from '@/features/presence/presenceTypes'

// Mock stores
jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockHomeStore = homeStore as jest.MockedFunction<typeof homeStore>
const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
>

describe('PresenceIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettingsStore.mockImplementation((selector) => {
      const state = { presenceDetectionEnabled: true }
      return selector(state as any)
    })
  })

  describe('visibility', () => {
    it('should not render when presence detection is disabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = { presenceDetectionEnabled: false }
        return selector(state as any)
      })
      mockHomeStore.mockImplementation((selector) => {
        const state = { presenceState: 'idle' as PresenceState }
        return selector(state as any)
      })

      const { container } = render(<PresenceIndicator />)
      expect(container.firstChild).toBeNull()
    })

    it('should render when presence detection is enabled', () => {
      mockHomeStore.mockImplementation((selector) => {
        const state = { presenceState: 'idle' as PresenceState }
        return selector(state as any)
      })

      const { container } = render(<PresenceIndicator />)
      expect(container.firstChild).not.toBeNull()
    })
  })

  describe('state display', () => {
    const states: { state: PresenceState; expectedClass: string }[] = [
      { state: 'idle', expectedClass: 'bg-gray-400' },
      { state: 'detected', expectedClass: 'bg-green-500' },
      { state: 'greeting', expectedClass: 'bg-blue-500' },
      { state: 'conversation-ready', expectedClass: 'bg-green-500' },
    ]

    states.forEach(({ state, expectedClass }) => {
      it(`should display correct color for ${state} state`, () => {
        mockHomeStore.mockImplementation((selector) => {
          const mockState = { presenceState: state }
          return selector(mockState as any)
        })

        const { container } = render(<PresenceIndicator />)
        const indicator = container.querySelector(
          '[data-testid="presence-indicator-dot"]'
        )
        expect(indicator).toHaveClass(expectedClass)
      })
    })
  })

  describe('animation', () => {
    it('should show pulse animation when in detected state', () => {
      mockHomeStore.mockImplementation((selector) => {
        const state = { presenceState: 'detected' as PresenceState }
        return selector(state as any)
      })

      const { container } = render(<PresenceIndicator />)
      const indicator = container.querySelector(
        '[data-testid="presence-indicator-dot"]'
      )
      expect(indicator).toHaveClass('animate-pulse')
    })

    it('should not show pulse animation when in idle state', () => {
      mockHomeStore.mockImplementation((selector) => {
        const state = { presenceState: 'idle' as PresenceState }
        return selector(state as any)
      })

      const { container } = render(<PresenceIndicator />)
      const indicator = container.querySelector(
        '[data-testid="presence-indicator-dot"]'
      )
      expect(indicator).not.toHaveClass('animate-pulse')
    })
  })

  describe('className prop', () => {
    it('should apply custom className', () => {
      mockHomeStore.mockImplementation((selector) => {
        const state = { presenceState: 'idle' as PresenceState }
        return selector(state as any)
      })

      const { container } = render(
        <PresenceIndicator className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
