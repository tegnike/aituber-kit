/**
 * PresenceSettings Component Tests
 *
 * 人感検知機能の設定UIコンポーネントのテスト
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.4
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PresenceSettings from '@/components/settings/presenceSettings'
import settingsStore from '@/features/stores/settings'

// Mock stores
const mockSetState = jest.fn()

jest.mock('@/features/stores/settings', () => {
  const actualModule = jest.requireActual('@/features/stores/settings')
  return {
    __esModule: true,
    default: Object.assign(jest.fn(), {
      setState: (arg: any) => mockSetState(arg),
      getState: () => ({
        presenceDetectionEnabled: false,
        presenceGreetingMessage: 'いらっしゃいませ！',
        presenceDepartureTimeout: 3,
        presenceCooldownTime: 5,
        presenceDetectionSensitivity: 'medium',
        presenceDebugMode: false,
      }),
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

describe('PresenceSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        presenceDetectionEnabled: false,
        presenceGreetingMessage: 'いらっしゃいませ！',
        presenceDepartureTimeout: 3,
        presenceCooldownTime: 5,
        presenceDetectionSensitivity: 'medium' as const,
        presenceDebugMode: false,
      }
      return selector(state as any)
    })
  })

  describe('rendering', () => {
    it('should render presence detection toggle', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceDetectionEnabled')).toBeInTheDocument()
    })

    it('should render greeting message textarea', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceGreetingMessage')).toBeInTheDocument()
    })

    it('should render departure timeout input', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceDepartureTimeout')).toBeInTheDocument()
    })

    it('should render cooldown time input', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceCooldownTime')).toBeInTheDocument()
    })

    it('should render sensitivity select', () => {
      render(<PresenceSettings />)
      expect(
        screen.getByText('PresenceDetectionSensitivity')
      ).toBeInTheDocument()
    })

    it('should render debug mode toggle', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceDebugMode')).toBeInTheDocument()
    })
  })

  describe('toggle enabled state', () => {
    it('should display OFF status when disabled', () => {
      render(<PresenceSettings />)
      // Multiple StatusOff buttons exist - check that at least one exists
      expect(screen.getAllByText('StatusOff').length).toBeGreaterThan(0)
    })

    it('should display ON status when enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = {
          presenceDetectionEnabled: true,
          presenceGreetingMessage: 'いらっしゃいませ！',
          presenceDepartureTimeout: 3,
          presenceCooldownTime: 5,
          presenceDetectionSensitivity: 'medium' as const,
          presenceDebugMode: false,
        }
        return selector(state as any)
      })

      render(<PresenceSettings />)
      expect(screen.getByText('StatusOn')).toBeInTheDocument()
    })

    it('should call setState when toggle is clicked', () => {
      render(<PresenceSettings />)
      // First StatusOff button is for detection enabled
      const toggleButtons = screen.getAllByText('StatusOff')
      fireEvent.click(toggleButtons[0])
      expect(mockSetState).toHaveBeenCalled()
    })
  })

  describe('greeting message', () => {
    it('should display current greeting message', () => {
      render(<PresenceSettings />)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveValue('いらっしゃいませ！')
    })

    it('should call setState when greeting message changes', () => {
      render(<PresenceSettings />)
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: '新しいメッセージ' } })
      expect(mockSetState).toHaveBeenCalledWith({
        presenceGreetingMessage: '新しいメッセージ',
      })
    })
  })

  describe('departure timeout', () => {
    it('should display current departure timeout', () => {
      render(<PresenceSettings />)
      const input = screen.getByLabelText('PresenceDepartureTimeout')
      expect(input).toHaveValue(3)
    })

    it('should call setState when departure timeout changes', () => {
      render(<PresenceSettings />)
      const input = screen.getByLabelText('PresenceDepartureTimeout')
      fireEvent.change(input, { target: { value: '5' } })
      expect(mockSetState).toHaveBeenCalledWith({
        presenceDepartureTimeout: 5,
      })
    })
  })

  describe('cooldown time', () => {
    it('should display current cooldown time', () => {
      render(<PresenceSettings />)
      const input = screen.getByLabelText('PresenceCooldownTime')
      expect(input).toHaveValue(5)
    })

    it('should call setState when cooldown time changes', () => {
      render(<PresenceSettings />)
      const input = screen.getByLabelText('PresenceCooldownTime')
      fireEvent.change(input, { target: { value: '10' } })
      expect(mockSetState).toHaveBeenCalledWith({
        presenceCooldownTime: 10,
      })
    })
  })

  describe('sensitivity', () => {
    it('should display current sensitivity', () => {
      render(<PresenceSettings />)
      const select = screen.getByLabelText('PresenceDetectionSensitivity')
      expect(select).toHaveValue('medium')
    })

    it('should call setState when sensitivity changes', () => {
      render(<PresenceSettings />)
      const select = screen.getByLabelText('PresenceDetectionSensitivity')
      fireEvent.change(select, { target: { value: 'high' } })
      expect(mockSetState).toHaveBeenCalledWith({
        presenceDetectionSensitivity: 'high',
      })
    })
  })

  describe('debug mode', () => {
    it('should call setState when debug mode toggle is clicked', () => {
      render(<PresenceSettings />)
      const buttons = screen.getAllByText('StatusOff')
      // Second StatusOff button is for debug mode
      fireEvent.click(buttons[1])
      expect(mockSetState).toHaveBeenCalled()
    })
  })
})
