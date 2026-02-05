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
import { createIdlePhrase } from '@/features/idle/idleTypes'

// Mock stores
const mockSetState = jest.fn()

jest.mock('@/features/stores/settings', () => {
  return {
    __esModule: true,
    default: Object.assign(jest.fn(), {
      setState: (arg: any) => mockSetState(arg),
      getState: () => ({
        presenceDetectionEnabled: false,
        presenceGreetingPhrases: [],
        presenceDepartureTimeout: 3,
        presenceCooldownTime: 5,
        presenceDetectionSensitivity: 'medium',
        presenceDetectionThreshold: 0,
        presenceDebugMode: false,
        presenceDeparturePhrases: [],
        presenceClearChatOnDeparture: true,
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

/**
 * 折りたたみセクションを展開するヘルパー関数
 */
const expandSection = (sectionTitle: string) => {
  const sectionButton = screen.getByText(sectionTitle).closest('button')
  if (sectionButton) {
    fireEvent.click(sectionButton)
  }
}

describe('PresenceSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettingsStore.mockImplementation((selector) => {
      const state = {
        presenceDetectionEnabled: false,
        presenceGreetingPhrases: [
          createIdlePhrase('いらっしゃいませ！', 'happy', 0),
        ],
        presenceDepartureTimeout: 3,
        presenceCooldownTime: 5,
        presenceDetectionSensitivity: 'medium' as const,
        presenceDetectionThreshold: 0,
        presenceDebugMode: false,
        presenceDeparturePhrases: [],
        presenceClearChatOnDeparture: true,
        realtimeAPIMode: false,
        audioMode: false,
        externalLinkageMode: false,
        slideMode: false,
      }
      return selector(state as any)
    })
  })

  describe('rendering', () => {
    it('should render presence detection toggle', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceDetectionEnabled')).toBeInTheDocument()
    })

    it('should render greeting phrases section', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceGreetingPhrases')).toBeInTheDocument()
    })

    it('should render departure timeout input after expanding timing section', () => {
      render(<PresenceSettings />)
      expandSection('PresenceTimingSettings')
      expect(screen.getByText('PresenceDepartureTimeout')).toBeInTheDocument()
    })

    it('should render cooldown time input after expanding timing section', () => {
      render(<PresenceSettings />)
      expandSection('PresenceTimingSettings')
      expect(screen.getByText('PresenceCooldownTime')).toBeInTheDocument()
    })

    it('should render sensitivity select after expanding detection section', () => {
      render(<PresenceSettings />)
      expandSection('PresenceDetectionSettings')
      expect(
        screen.getByText('PresenceDetectionSensitivity')
      ).toBeInTheDocument()
    })

    it('should render debug mode toggle after expanding developer section', () => {
      render(<PresenceSettings />)
      expandSection('PresenceDeveloperSettings')
      expect(screen.getByText('PresenceDebugMode')).toBeInTheDocument()
    })

    it('should render departure phrases section', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceDeparturePhrases')).toBeInTheDocument()
    })

    it('should render collapsible section headers', () => {
      render(<PresenceSettings />)
      expect(screen.getByText('PresenceTimingSettings')).toBeInTheDocument()
      expect(screen.getByText('PresenceDetectionSettings')).toBeInTheDocument()
      expect(screen.getByText('PresenceDeveloperSettings')).toBeInTheDocument()
    })
  })

  describe('toggle enabled state', () => {
    it('should render toggle switches', () => {
      render(<PresenceSettings />)
      // Check that toggle switches exist via their role
      const toggleButtons = screen.getAllByRole('switch')
      expect(toggleButtons.length).toBeGreaterThan(0)
    })

    it('should call setState when toggle is clicked', () => {
      render(<PresenceSettings />)
      // First toggle is for detection enabled
      const toggleButtons = screen.getAllByRole('switch')
      fireEvent.click(toggleButtons[0])
      expect(mockSetState).toHaveBeenCalled()
    })
  })

  describe('greeting phrases list', () => {
    it('should display existing greeting phrases', () => {
      render(<PresenceSettings />)
      const input = screen.getByDisplayValue('いらっしゃいませ！')
      expect(input).toBeInTheDocument()
    })

    it('should call setState when add phrase button is clicked with text', () => {
      render(<PresenceSettings />)
      const inputs = screen.getAllByPlaceholderText(
        'PresencePhraseTextPlaceholder'
      )
      const addButton = screen.getAllByText('PresenceAddPhrase')[0]

      fireEvent.change(inputs[0], { target: { value: '新しいメッセージ' } })
      fireEvent.click(addButton)

      expect(mockSetState).toHaveBeenCalledWith(
        expect.objectContaining({
          presenceGreetingPhrases: expect.any(Array),
        })
      )
    })

    it('should call setState when delete button is clicked', () => {
      render(<PresenceSettings />)
      const deleteButtons = screen.getAllByLabelText('PresenceDeletePhrase')
      fireEvent.click(deleteButtons[0])

      expect(mockSetState).toHaveBeenCalledWith(
        expect.objectContaining({
          presenceGreetingPhrases: expect.any(Array),
        })
      )
    })
  })

  describe('departure timeout', () => {
    it('should display current departure timeout after expanding section', () => {
      render(<PresenceSettings />)
      expandSection('PresenceTimingSettings')
      const input = screen.getByLabelText('PresenceDepartureTimeout')
      expect(input).toHaveValue(3)
    })

    it('should call setState when departure timeout changes', () => {
      render(<PresenceSettings />)
      expandSection('PresenceTimingSettings')
      const input = screen.getByLabelText('PresenceDepartureTimeout')
      fireEvent.change(input, { target: { value: '5' } })
      expect(mockSetState).toHaveBeenCalledWith({
        presenceDepartureTimeout: 5,
      })
    })
  })

  describe('cooldown time', () => {
    it('should display current cooldown time after expanding section', () => {
      render(<PresenceSettings />)
      expandSection('PresenceTimingSettings')
      const input = screen.getByLabelText('PresenceCooldownTime')
      expect(input).toHaveValue(5)
    })

    it('should call setState when cooldown time changes', () => {
      render(<PresenceSettings />)
      expandSection('PresenceTimingSettings')
      const input = screen.getByLabelText('PresenceCooldownTime')
      fireEvent.change(input, { target: { value: '10' } })
      expect(mockSetState).toHaveBeenCalledWith({
        presenceCooldownTime: 10,
      })
    })
  })

  describe('sensitivity', () => {
    it('should display current sensitivity after expanding section', () => {
      render(<PresenceSettings />)
      expandSection('PresenceDetectionSettings')
      const select = screen.getByLabelText('PresenceDetectionSensitivity')
      expect(select).toHaveValue('medium')
    })

    it('should call setState when sensitivity changes', () => {
      render(<PresenceSettings />)
      expandSection('PresenceDetectionSettings')
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
      expandSection('PresenceDeveloperSettings')
      const toggleButtons = screen.getAllByRole('switch')
      // Last switch is for debug mode (after expanding developer section)
      fireEvent.click(toggleButtons[toggleButtons.length - 1])
      expect(mockSetState).toHaveBeenCalled()
    })
  })

  describe('collapsible sections', () => {
    it('should toggle timing section visibility', () => {
      render(<PresenceSettings />)
      // Initially collapsed - content should not be visible
      expect(
        screen.queryByLabelText('PresenceDepartureTimeout')
      ).not.toBeInTheDocument()

      // Expand section
      expandSection('PresenceTimingSettings')
      expect(
        screen.getByLabelText('PresenceDepartureTimeout')
      ).toBeInTheDocument()

      // Collapse section
      expandSection('PresenceTimingSettings')
      expect(
        screen.queryByLabelText('PresenceDepartureTimeout')
      ).not.toBeInTheDocument()
    })

    it('should toggle detection section visibility', () => {
      render(<PresenceSettings />)
      // Initially collapsed
      expect(
        screen.queryByLabelText('PresenceDetectionSensitivity')
      ).not.toBeInTheDocument()

      // Expand section
      expandSection('PresenceDetectionSettings')
      expect(
        screen.getByLabelText('PresenceDetectionSensitivity')
      ).toBeInTheDocument()
    })

    it('should toggle developer section visibility', () => {
      render(<PresenceSettings />)
      // Initially collapsed - debug mode toggle not visible
      const initialSwitches = screen.getAllByRole('switch')
      const initialCount = initialSwitches.length

      // Expand section
      expandSection('PresenceDeveloperSettings')
      const expandedSwitches = screen.getAllByRole('switch')
      expect(expandedSwitches.length).toBeGreaterThan(initialCount)
    })
  })
})
