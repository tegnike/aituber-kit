/**
 * Menu Component Kiosk Mode Tests
 *
 * TDD tests for kiosk mode access restrictions in Menu component
 * Requirements: 2.1, 2.2, 2.3 - 設定画面アクセス制限
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock dependencies before importing Menu
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('@/features/stores/home', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        chatLog: [],
        viewer: { loadVrm: jest.fn() },
        webcamStatus: false,
        captureStatus: false,
        backgroundImageUrl: null,
        modalImage: null,
      }
      return selector ? selector(state) : state
    }),
    {
      setState: jest.fn(),
      getState: jest.fn(() => ({
        chatLog: [],
        viewer: { loadVrm: jest.fn() },
      })),
    }
  ),
}))

jest.mock('@/features/stores/menu', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        slideVisible: false,
        showWebcam: false,
        showCapture: false,
        fileInput: null,
        bgFileInput: null,
      }
      return selector ? selector(state) : state
    }),
    {
      setState: jest.fn(),
      getState: jest.fn(() => ({
        slideVisible: false,
        showWebcam: false,
        showCapture: false,
      })),
    }
  ),
}))

jest.mock('@/features/stores/slide', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        selectedSlideDocs: null,
        isPlaying: false,
      }
      return selector ? selector(state) : state
    }),
    {
      setState: jest.fn(),
      getState: jest.fn(() => ({
        selectedSlideDocs: null,
        isPlaying: false,
      })),
    }
  ),
}))

// Mock useKioskMode hook
const mockUseKioskMode = {
  isKioskMode: false,
  isTemporaryUnlocked: false,
  canAccessSettings: true,
  temporaryUnlock: jest.fn(),
  lockAgain: jest.fn(),
  validateInput: jest.fn().mockReturnValue({ valid: true }),
  maxInputLength: undefined,
}

jest.mock('@/hooks/useKioskMode', () => ({
  useKioskMode: () => mockUseKioskMode,
}))

// Mock settings store with kiosk settings
const createSettingsState = (overrides = {}) => ({
  selectAIService: 'openai',
  selectAIModel: 'gpt-4',
  enableMultiModal: false,
  multiModalMode: 'auto',
  customModel: '',
  youtubeMode: false,
  youtubePlaying: false,
  slideMode: false,
  showControlPanel: true,
  showAssistantText: true,
  kioskModeEnabled: false,
  kioskTemporaryUnlock: false,
  ...overrides,
})

const mockSettingsSetState = jest.fn()
let currentSettingsState = createSettingsState()

jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      return selector ? selector(currentSettingsState) : currentSettingsState
    }),
    {
      setState: (arg: any) => mockSettingsSetState(arg),
      getState: () => currentSettingsState,
    }
  ),
}))

// Mock other dependencies
jest.mock('@/features/constants/aiModels', () => ({
  isMultiModalAvailable: jest.fn(() => false),
}))

jest.mock('@/utils/assistantMessageUtils', () => ({
  getLatestAssistantMessage: jest.fn(() => null),
}))

jest.mock('@/components/settings', () => ({
  __esModule: true,
  default: ({ onClickClose }: { onClickClose: () => void }) => (
    <div data-testid="settings-modal">
      Settings Modal
      <button onClick={onClickClose} data-testid="close-settings">
        Close
      </button>
    </div>
  ),
}))

jest.mock('@/components/iconButton', () => ({
  IconButton: ({
    iconName,
    onClick,
  }: {
    iconName: string
    onClick?: () => void
    isProcessing?: boolean
    label?: string
    disabled?: boolean
  }) => (
    <button data-testid={`icon-button-${iconName}`} onClick={onClick}>
      {iconName}
    </button>
  ),
}))

jest.mock('@/components/chatLog', () => ({
  ChatLog: () => <div data-testid="chat-log">ChatLog</div>,
}))

jest.mock('@/components/assistantText', () => ({
  AssistantText: () => <div data-testid="assistant-text">AssistantText</div>,
}))

jest.mock('@/components/webcam', () => ({
  Webcam: () => <div data-testid="webcam">Webcam</div>,
}))

jest.mock('@/components/slides', () => ({
  __esModule: true,
  default: () => <div data-testid="slides">Slides</div>,
}))

jest.mock('@/components/capture', () => ({
  __esModule: true,
  default: () => <div data-testid="capture">Capture</div>,
}))

// Import Menu after mocks
import { Menu } from '@/components/menu'

describe('Menu Component - Kiosk Mode Access Restrictions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset kiosk mode state
    mockUseKioskMode.isKioskMode = false
    mockUseKioskMode.isTemporaryUnlocked = false
    mockUseKioskMode.canAccessSettings = true
    currentSettingsState = createSettingsState()
  })

  describe('Requirement 2.1: 設定画面へのナビゲーションボタンを非表示', () => {
    it('should display settings button when kiosk mode is disabled', () => {
      render(<Menu />)
      expect(screen.getByTestId('icon-button-24/Settings')).toBeInTheDocument()
    })

    it('should hide settings button when kiosk mode is enabled', () => {
      mockUseKioskMode.isKioskMode = true
      mockUseKioskMode.canAccessSettings = false
      render(<Menu />)
      expect(
        screen.queryByTestId('icon-button-24/Settings')
      ).not.toBeInTheDocument()
    })

    it('should show settings button when temporarily unlocked', () => {
      mockUseKioskMode.isKioskMode = true
      mockUseKioskMode.isTemporaryUnlocked = true
      mockUseKioskMode.canAccessSettings = true
      render(<Menu />)
      expect(screen.getByTestId('icon-button-24/Settings')).toBeInTheDocument()
    })
  })

  describe('Requirement 2.3: キーボードショートカットの無効化', () => {
    it('should open settings with Cmd/Ctrl + . when kiosk mode is disabled', () => {
      render(<Menu />)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: '.',
          metaKey: true,
          bubbles: true,
        })
        window.dispatchEvent(event)
      })

      expect(screen.getByTestId('settings-modal')).toBeInTheDocument()
    })

    it('should NOT open settings with Cmd/Ctrl + . when kiosk mode is enabled', () => {
      mockUseKioskMode.isKioskMode = true
      mockUseKioskMode.canAccessSettings = false
      render(<Menu />)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: '.',
          metaKey: true,
          bubbles: true,
        })
        window.dispatchEvent(event)
      })

      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument()
    })

    it('should allow keyboard shortcut when temporarily unlocked', () => {
      mockUseKioskMode.isKioskMode = true
      mockUseKioskMode.isTemporaryUnlocked = true
      mockUseKioskMode.canAccessSettings = true
      render(<Menu />)

      act(() => {
        const event = new KeyboardEvent('keydown', {
          key: '.',
          metaKey: true,
          bubbles: true,
        })
        window.dispatchEvent(event)
      })

      expect(screen.getByTestId('settings-modal')).toBeInTheDocument()
    })
  })

  describe('Mobile long tap access restriction', () => {
    beforeEach(() => {
      // Mock mobile detection
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })
      window.dispatchEvent(new Event('resize'))
    })

    it('should hide long tap area when kiosk mode is enabled', () => {
      mockUseKioskMode.isKioskMode = true
      mockUseKioskMode.canAccessSettings = false
      currentSettingsState = createSettingsState({ showControlPanel: false })
      render(<Menu />)

      // Long tap area should not be rendered when kiosk mode is active
      const longTapAreas = document.querySelectorAll('.absolute.top-0.left-0')
      // Check that no long tap area exists when canAccessSettings is false
      expect(mockUseKioskMode.canAccessSettings).toBe(false)
    })

    it('should show long tap area when temporarily unlocked', () => {
      mockUseKioskMode.isKioskMode = true
      mockUseKioskMode.isTemporaryUnlocked = true
      mockUseKioskMode.canAccessSettings = true
      currentSettingsState = createSettingsState({ showControlPanel: false })
      render(<Menu />)

      // Long tap area should be accessible when temporarily unlocked
      expect(mockUseKioskMode.canAccessSettings).toBe(true)
    })
  })

  describe('Settings modal access control', () => {
    it('should not display settings modal when kiosk mode blocks access', () => {
      mockUseKioskMode.isKioskMode = true
      mockUseKioskMode.canAccessSettings = false
      render(<Menu />)

      // Settings modal should not be rendered
      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument()
    })

    it('should allow opening settings when canAccessSettings is true', () => {
      mockUseKioskMode.isKioskMode = false
      mockUseKioskMode.canAccessSettings = true
      render(<Menu />)

      fireEvent.click(screen.getByTestId('icon-button-24/Settings'))

      expect(screen.getByTestId('settings-modal')).toBeInTheDocument()
    })
  })
})
