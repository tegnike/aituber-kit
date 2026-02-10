/**
 * Menu Component - Kiosk Mode Tests
 *
 * キオスクモード時のメニュー表示制御テスト
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Menu } from '@/components/menu'
import settingsStore from '@/features/stores/settings'
import menuStore from '@/features/stores/menu'
import homeStore from '@/features/stores/home'

// Mock useKioskMode
const mockUseKioskMode = jest.fn(() => ({
  isKioskMode: false,
  isTemporaryUnlocked: false,
  canAccessSettings: true,
  maxInputLength: 200,
  validateInput: jest.fn(() => ({ valid: true })),
  temporaryUnlock: jest.fn(),
  lockAgain: jest.fn(),
}))

jest.mock('@/hooks/useKioskMode', () => ({
  useKioskMode: () => mockUseKioskMode(),
}))

// Mock stores
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    setState: jest.fn(),
    getState: jest.fn(() => ({})),
  }),
}))

jest.mock('@/features/stores/menu', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), {
    setState: jest.fn(),
    getState: jest.fn(() => ({})),
  }),
}))

jest.mock('@/features/stores/home', () => {
  const getStateMock = jest.fn(() => ({
    chatLog: [],
    viewer: { loadVrm: jest.fn() },
    webcamStatus: false,
    captureStatus: false,
    backgroundImageUrl: '',
  }))
  const subscribeMock = jest.fn(() => jest.fn())
  const setStateMock = jest.fn()

  return {
    __esModule: true,
    default: Object.assign(jest.fn(), {
      getState: getStateMock,
      subscribe: subscribeMock,
      setState: setStateMock,
    }),
  }
})

jest.mock('@/features/stores/slide', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock sub-components
jest.mock('@/components/settings', () => ({
  __esModule: true,
  default: () => <div data-testid="settings" />,
}))

jest.mock('@/components/assistantText', () => ({
  AssistantText: () => <div data-testid="assistant-text" />,
}))

jest.mock('@/components/chatLog', () => ({
  ChatLog: () => <div data-testid="chat-log" />,
}))

jest.mock('@/components/iconButton', () => ({
  IconButton: ({ onClick, iconName }: any) => (
    <button data-testid={`icon-${iconName}`} onClick={onClick}>
      {iconName}
    </button>
  ),
}))

jest.mock('@/components/webcam', () => ({
  Webcam: () => <div data-testid="webcam" />,
}))

jest.mock('@/components/slides', () => ({
  __esModule: true,
  default: () => <div data-testid="slides" />,
}))

jest.mock('@/components/capture', () => ({
  __esModule: true,
  default: () => <div data-testid="capture" />,
}))

jest.mock('@/features/constants/aiModels', () => ({
  isMultiModalAvailable: jest.fn(() => false),
}))

jest.mock('@/utils/assistantMessageUtils', () => ({
  getLatestAssistantMessage: jest.fn(() => null),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

const mockSettingsStore = settingsStore as jest.MockedFunction<
  typeof settingsStore
>
const mockMenuStore = menuStore as jest.MockedFunction<typeof menuStore>

import slideStore from '@/features/stores/slide'
const mockSlideStore = slideStore as jest.MockedFunction<typeof slideStore>

describe('Menu - Kiosk Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default settings store mock
    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        selectAIService: 'openai',
        selectAIModel: 'gpt-4',
        enableMultiModal: false,
        multiModalMode: 'never',
        customModel: false,
        youtubeMode: false,
        youtubePlaying: false,
        slideMode: false,
        showControlPanel: true,
        showAssistantText: true,
      }
      return selector(state as any)
    })

    // Default menu store mock
    mockMenuStore.mockImplementation((selector) => {
      const state = {
        slideVisible: false,
        showWebcam: false,
        showCapture: false,
      }
      return selector(state as any)
    })

    // Default home store mock
    ;(homeStore as any).mockImplementation((selector: any) => {
      const state = { chatLog: [] }
      return selector(state as any)
    })

    // Default slide store mock
    mockSlideStore.mockImplementation((selector) => {
      const state = {
        isPlaying: false,
        selectedSlideDocs: null,
      }
      return selector(state as any)
    })
  })

  describe('control panel visibility', () => {
    it('should show settings button when kiosk mode is off and control panel is visible', () => {
      mockUseKioskMode.mockReturnValue({
        isKioskMode: false,
        isTemporaryUnlocked: false,
        canAccessSettings: true,
        maxInputLength: 200,
        validateInput: jest.fn(() => ({ valid: true })),
        temporaryUnlock: jest.fn(),
        lockAgain: jest.fn(),
      })

      const { container } = render(<Menu />)
      const settingsButton = container.querySelector(
        '[data-testid="icon-24/Settings"]'
      )
      expect(settingsButton).not.toBeNull()
    })

    it('should hide settings button when kiosk mode is on and not temporarily unlocked', () => {
      mockUseKioskMode.mockReturnValue({
        isKioskMode: true,
        isTemporaryUnlocked: false,
        canAccessSettings: false,
        maxInputLength: 200,
        validateInput: jest.fn(() => ({ valid: true })),
        temporaryUnlock: jest.fn(),
        lockAgain: jest.fn(),
      })

      const { container } = render(<Menu />)
      const settingsButton = container.querySelector(
        '[data-testid="icon-24/Settings"]'
      )
      expect(settingsButton).toBeNull()
    })

    it('should show settings button when kiosk mode is on but temporarily unlocked', () => {
      mockUseKioskMode.mockReturnValue({
        isKioskMode: true,
        isTemporaryUnlocked: true,
        canAccessSettings: true,
        maxInputLength: 200,
        validateInput: jest.fn(() => ({ valid: true })),
        temporaryUnlock: jest.fn(),
        lockAgain: jest.fn(),
      })

      const { container } = render(<Menu />)
      const settingsButton = container.querySelector(
        '[data-testid="icon-24/Settings"]'
      )
      expect(settingsButton).not.toBeNull()
    })
  })

  describe('control panel with kiosk mode', () => {
    it('should hide entire control panel in kiosk mode when showControlPanel is true', () => {
      mockUseKioskMode.mockReturnValue({
        isKioskMode: true,
        isTemporaryUnlocked: false,
        canAccessSettings: false,
        maxInputLength: 200,
        validateInput: jest.fn(() => ({ valid: true })),
        temporaryUnlock: jest.fn(),
        lockAgain: jest.fn(),
      })

      mockSettingsStore.mockImplementation((selector) => {
        const state = {
          selectAIService: 'openai',
          selectAIModel: 'gpt-4',
          enableMultiModal: false,
          multiModalMode: 'never',
          customModel: false,
          youtubeMode: false,
          youtubePlaying: false,
          slideMode: false,
          showControlPanel: true,
          showAssistantText: true,
        }
        return selector(state as any)
      })

      const { container } = render(<Menu />)
      // effectiveShowControlPanel should be false (showControlPanel && (!isKioskMode || isTemporaryUnlocked))
      // showControlPanel=true, isKioskMode=true, isTemporaryUnlocked=false => false
      const settingsButton = container.querySelector(
        '[data-testid="icon-24/Settings"]'
      )
      expect(settingsButton).toBeNull()
    })
  })
})
