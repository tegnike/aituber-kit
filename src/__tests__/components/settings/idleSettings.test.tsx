/**
 * IdleSettings Component Tests
 *
 * TDD tests for idle mode settings UI
 * Requirements: 1.1, 3.1-3.3, 4.1-4.4, 7.2-7.3, 8.2-8.3
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import IdleSettings from '@/components/settings/idleSettings'
import settingsStore from '@/features/stores/settings'

// Mock stores
const mockSetState = jest.fn()

jest.mock('@/features/stores/settings', () => {
  return {
    __esModule: true,
    default: Object.assign(jest.fn(), {
      setState: (arg: any) => mockSetState(arg),
      getState: () => ({
        idleModeEnabled: false,
        idlePhrases: [],
        idlePlaybackMode: 'sequential',
        idleInterval: 30,
        idleDefaultEmotion: 'neutral',
        idleTimePeriodEnabled: false,
        idleTimePeriodMorning: 'おはようございます！',
        idleTimePeriodMorningEmotion: 'happy',
        idleTimePeriodAfternoon: 'こんにちは！',
        idleTimePeriodAfternoonEmotion: 'happy',
        idleTimePeriodEvening: 'こんばんは！',
        idleTimePeriodEveningEmotion: 'relaxed',
        idleAiGenerationEnabled: false,
        idleAiPromptTemplate:
          '展示会の来場者に向けて、親しみやすい一言を生成してください。',
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

const createDefaultState = (overrides = {}) => ({
  idleModeEnabled: false,
  idlePhrases: [] as {
    id: string
    text: string
    emotion: string
    order: number
  }[],
  idlePlaybackMode: 'sequential' as const,
  idleInterval: 30,
  idleDefaultEmotion: 'neutral' as const,
  idleTimePeriodEnabled: false,
  idleTimePeriodMorning: 'おはようございます！',
  idleTimePeriodMorningEmotion: 'happy' as const,
  idleTimePeriodAfternoon: 'こんにちは！',
  idleTimePeriodAfternoonEmotion: 'happy' as const,
  idleTimePeriodEvening: 'こんばんは！',
  idleTimePeriodEveningEmotion: 'relaxed' as const,
  idleAiGenerationEnabled: false,
  idleAiPromptTemplate:
    '展示会の来場者に向けて、親しみやすい一言を生成してください。',
  ...overrides,
})

describe('IdleSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettingsStore.mockImplementation((selector) => {
      const state = createDefaultState()
      return selector(state as any)
    })
  })

  describe('Requirement 1.1: 有効/無効トグル', () => {
    it('should render the enable/disable toggle', () => {
      render(<IdleSettings />)
      expect(screen.getByText('IdleModeEnabled')).toBeInTheDocument()
    })

    it('should render toggle switches', () => {
      render(<IdleSettings />)
      // Check that toggle switches exist via their role
      const toggleButtons = screen.getAllByRole('switch')
      expect(toggleButtons.length).toBeGreaterThan(0)
    })

    it('should toggle idle mode when button is clicked', () => {
      render(<IdleSettings />)
      // First toggle is for idle mode enabled
      const toggleButtons = screen.getAllByRole('switch')
      fireEvent.click(toggleButtons[0])
      expect(mockSetState).toHaveBeenCalled()
    })
  })

  describe('Requirement 4.1, 4.3, 4.4: 発話間隔設定', () => {
    it('should render interval input field', () => {
      render(<IdleSettings />)
      expect(screen.getByText('IdleInterval')).toBeInTheDocument()
    })

    it('should display interval value of 30 seconds by default', () => {
      render(<IdleSettings />)
      const input = screen.getByLabelText('IdleInterval')
      expect(input).toHaveValue(30)
    })

    it('should update interval when changed', () => {
      render(<IdleSettings />)
      const input = screen.getByLabelText('IdleInterval')
      fireEvent.change(input, { target: { value: '60' } })
      expect(mockSetState).toHaveBeenCalledWith({ idleInterval: 60 })
    })

    it('should clamp value to minimum 10 seconds on blur', () => {
      // Mock implementation to return the changed value for clamping
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({ idleInterval: 5 })
        return selector(state as any)
      })
      render(<IdleSettings />)
      const input = screen.getByLabelText('IdleInterval')
      fireEvent.blur(input)
      expect(mockSetState).toHaveBeenCalledWith({ idleInterval: 10 })
    })

    it('should clamp value to maximum 300 seconds on blur', () => {
      // Mock implementation to return the changed value for clamping
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({ idleInterval: 500 })
        return selector(state as any)
      })
      render(<IdleSettings />)
      const input = screen.getByLabelText('IdleInterval')
      fireEvent.blur(input)
      expect(mockSetState).toHaveBeenCalledWith({ idleInterval: 300 })
    })
  })

  describe('Requirement 3.3: 再生モード選択', () => {
    it('should render playback mode selector', () => {
      render(<IdleSettings />)
      expect(screen.getByText('IdlePlaybackMode')).toBeInTheDocument()
    })

    it('should allow selecting sequential or random mode', () => {
      render(<IdleSettings />)
      const select = screen.getByLabelText('IdlePlaybackMode')
      expect(select).toBeInTheDocument()
      fireEvent.change(select, { target: { value: 'random' } })
      expect(mockSetState).toHaveBeenCalledWith({ idlePlaybackMode: 'random' })
    })
  })

  describe('Requirement 3.1: 発話リスト編集UI', () => {
    it('should render phrase list section', () => {
      render(<IdleSettings />)
      expect(screen.getByText('IdlePhrases')).toBeInTheDocument()
    })

    it('should display add phrase button', () => {
      render(<IdleSettings />)
      expect(screen.getByText('IdleAddPhrase')).toBeInTheDocument()
    })

    it('should display existing phrases when available', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({
          idlePhrases: [
            { id: '1', text: 'テスト発話', emotion: 'neutral', order: 0 },
          ],
        })
        return selector(state as any)
      })
      render(<IdleSettings />)
      expect(screen.getByDisplayValue('テスト発話')).toBeInTheDocument()
    })
  })

  describe('Requirement 7.2, 7.3: 時間帯別挨拶設定', () => {
    it('should render time period settings toggle', () => {
      render(<IdleSettings />)
      expect(screen.getByText('IdleTimePeriodEnabled')).toBeInTheDocument()
    })

    it('should show morning/afternoon/evening input fields when enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({ idleTimePeriodEnabled: true })
        return selector(state as any)
      })
      render(<IdleSettings />)
      expect(screen.getByText('IdleTimePeriodMorning')).toBeInTheDocument()
      expect(screen.getByText('IdleTimePeriodAfternoon')).toBeInTheDocument()
      expect(screen.getByText('IdleTimePeriodEvening')).toBeInTheDocument()
    })

    it('should not show time period inputs when disabled', () => {
      render(<IdleSettings />)
      expect(
        screen.queryByLabelText('IdleTimePeriodMorning')
      ).not.toBeInTheDocument()
    })
  })

  describe('Requirement 8.2, 8.3: AIランダム発話設定', () => {
    it('should render AI generation settings toggle', () => {
      render(<IdleSettings />)
      expect(screen.getByText('IdleAiGenerationEnabled')).toBeInTheDocument()
    })

    it('should show prompt template input when AI generation is enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({ idleAiGenerationEnabled: true })
        return selector(state as any)
      })
      render(<IdleSettings />)
      expect(screen.getByText('IdleAiPromptTemplate')).toBeInTheDocument()
    })
  })

  describe('Time period emotions', () => {
    it('should render per-period emotion selectors when time period is enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({ idleTimePeriodEnabled: true })
        return selector(state as any)
      })
      render(<IdleSettings />)
      expect(screen.getByLabelText('IdleTimePeriodMorning')).toBeInTheDocument()
      expect(
        screen.getByLabelText('IdleTimePeriodAfternoon')
      ).toBeInTheDocument()
      expect(screen.getByLabelText('IdleTimePeriodEvening')).toBeInTheDocument()
    })

    it('should not render time period inputs when time period is disabled', () => {
      render(<IdleSettings />)
      expect(
        screen.queryByLabelText('IdleTimePeriodMorning')
      ).not.toBeInTheDocument()
    })
  })
})
