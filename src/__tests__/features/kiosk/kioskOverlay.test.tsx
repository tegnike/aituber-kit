/**
 * KioskOverlay Component Tests
 *
 * Requirements: 4.1, 4.2 - フルスクリーン表示とUI制御
 */

import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'Kiosk.PasscodeTitle': 'パスコード入力',
        'Kiosk.ReturnToFullscreen': 'フルスクリーンに戻る',
        'Kiosk.FullscreenPrompt': 'タップしてフルスクリーンで開始',
        'Kiosk.Cancel': 'キャンセル',
        'Kiosk.Unlock': '解除',
      }
      return translations[key] || key
    },
  }),
}))

// Mock settings store
const mockSettingsState = {
  kioskModeEnabled: true,
  kioskPasscode: '1234',
  kioskTemporaryUnlock: false,
}

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockSettingsState)
    }
    return mockSettingsState
  }),
}))

// Mock useKioskMode
const mockUseKioskMode = {
  isKioskMode: true,
  isTemporaryUnlocked: false,
  canAccessSettings: false,
  temporaryUnlock: jest.fn(),
  lockAgain: jest.fn(),
  validateInput: jest.fn(() => ({ valid: true })),
  maxInputLength: 200,
}

jest.mock('@/hooks/useKioskMode', () => ({
  useKioskMode: () => mockUseKioskMode,
}))

// Mock useFullscreen
const mockUseFullscreen = {
  isFullscreen: false,
  isSupported: true,
  requestFullscreen: jest.fn(() => Promise.resolve()),
  exitFullscreen: jest.fn(() => Promise.resolve()),
  toggle: jest.fn(() => Promise.resolve()),
}

jest.mock('@/hooks/useFullscreen', () => ({
  useFullscreen: () => mockUseFullscreen,
}))

// Mock useEscLongPress
let escLongPressCallback: (() => void) | null = null
jest.mock('@/hooks/useEscLongPress', () => ({
  useEscLongPress: (callback: () => void) => {
    escLongPressCallback = callback
    return { isHolding: false }
  },
}))

// Mock useMultiTap
let multiTapCallback: (() => void) | null = null
jest.mock('@/hooks/useMultiTap', () => ({
  useMultiTap: (callback: () => void) => {
    multiTapCallback = callback
    return { ref: { current: null } }
  },
}))

// Import component after mocks
import { KioskOverlay } from '@/features/kiosk/kioskOverlay'

describe('KioskOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettingsState.kioskModeEnabled = true
    mockUseKioskMode.isKioskMode = true
    mockUseKioskMode.isTemporaryUnlocked = false
    mockUseFullscreen.isFullscreen = false
    mockUseFullscreen.isSupported = true
    escLongPressCallback = null
    multiTapCallback = null
  })

  describe('Rendering', () => {
    it('renders nothing when kiosk mode is disabled', () => {
      mockSettingsState.kioskModeEnabled = false
      mockUseKioskMode.isKioskMode = false

      const { container } = render(<KioskOverlay />)

      expect(container.firstChild).toBeNull()
    })

    it('renders overlay when kiosk mode is enabled', () => {
      render(<KioskOverlay />)

      // Overlay should be in the DOM
      expect(
        document.querySelector('[data-testid="kiosk-overlay"]')
      ).toBeInTheDocument()
    })

    it('renders nothing when temporarily unlocked', () => {
      mockUseKioskMode.isTemporaryUnlocked = true

      const { container } = render(<KioskOverlay />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Fullscreen prompt', () => {
    it('shows fullscreen prompt when not in fullscreen', () => {
      mockUseFullscreen.isFullscreen = false

      render(<KioskOverlay />)

      expect(
        screen.getByText('タップしてフルスクリーンで開始')
      ).toBeInTheDocument()
    })

    it('hides fullscreen prompt when in fullscreen', () => {
      mockUseFullscreen.isFullscreen = true

      render(<KioskOverlay />)

      expect(
        screen.queryByText('タップしてフルスクリーンで開始')
      ).not.toBeInTheDocument()
    })

    it('requests fullscreen when prompt is clicked', async () => {
      mockUseFullscreen.isFullscreen = false

      render(<KioskOverlay />)

      const prompt = screen.getByText('タップしてフルスクリーンで開始')
      await act(async () => {
        fireEvent.click(prompt)
      })

      expect(mockUseFullscreen.requestFullscreen).toHaveBeenCalled()
    })
  })

  describe('Return to fullscreen button', () => {
    it('shows return to fullscreen button when fullscreen is exited', () => {
      mockUseFullscreen.isFullscreen = false
      mockUseFullscreen.isSupported = true

      render(<KioskOverlay />)

      expect(screen.getByText('フルスクリーンに戻る')).toBeInTheDocument()
    })

    it('requests fullscreen when return button is clicked', async () => {
      mockUseFullscreen.isFullscreen = false

      render(<KioskOverlay />)

      const button = screen.getByText('フルスクリーンに戻る')
      await act(async () => {
        fireEvent.click(button)
      })

      expect(mockUseFullscreen.requestFullscreen).toHaveBeenCalled()
    })

    it('does not show return button when API is not supported', () => {
      mockUseFullscreen.isFullscreen = false
      mockUseFullscreen.isSupported = false

      render(<KioskOverlay />)

      expect(screen.queryByText('フルスクリーンに戻る')).not.toBeInTheDocument()
    })
  })

  describe('Passcode dialog', () => {
    it('opens passcode dialog on Esc long press', async () => {
      render(<KioskOverlay />)

      // Simulate Esc long press
      await act(async () => {
        if (escLongPressCallback) {
          escLongPressCallback()
        }
      })

      await waitFor(() => {
        expect(screen.getByText('パスコード入力')).toBeInTheDocument()
      })
    })

    it('closes passcode dialog on cancel', async () => {
      render(<KioskOverlay />)

      // Open dialog
      await act(async () => {
        if (escLongPressCallback) {
          escLongPressCallback()
        }
      })

      await waitFor(() => {
        expect(screen.getByText('パスコード入力')).toBeInTheDocument()
      })

      // Close dialog
      await act(async () => {
        fireEvent.click(screen.getByText('キャンセル'))
      })

      await waitFor(() => {
        expect(screen.queryByText('パスコード入力')).not.toBeInTheDocument()
      })
    })

    it('calls temporaryUnlock on successful passcode entry', async () => {
      render(<KioskOverlay />)

      // Open dialog
      await act(async () => {
        if (escLongPressCallback) {
          escLongPressCallback()
        }
      })

      await waitFor(() => {
        expect(screen.getByText('パスコード入力')).toBeInTheDocument()
      })

      // Enter correct passcode
      const input = screen.getByRole('textbox')
      await act(async () => {
        fireEvent.change(input, { target: { value: '1234' } })
      })

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByText('解除'))
      })

      expect(mockUseKioskMode.temporaryUnlock).toHaveBeenCalled()
    })
  })

  describe('Multi-tap zone', () => {
    it('renders multi-tap zone element', () => {
      render(<KioskOverlay />)

      expect(
        document.querySelector('[data-testid="kiosk-multi-tap-zone"]')
      ).toBeInTheDocument()
    })

    it('opens passcode dialog on multi-tap', async () => {
      render(<KioskOverlay />)

      // Simulate multi-tap callback
      await act(async () => {
        if (multiTapCallback) {
          multiTapCallback()
        }
      })

      await waitFor(() => {
        expect(screen.getByText('パスコード入力')).toBeInTheDocument()
      })
    })
  })
})
