/**
 * KioskSettings Component Tests
 *
 * TDD tests for kiosk mode settings UI
 * Requirements: 1.1, 1.2, 3.4, 6.3, 7.1, 7.3
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import KioskSettings from '@/components/settings/kioskSettings'
import settingsStore from '@/features/stores/settings'

// Mock stores
const mockSetState = jest.fn()

const defaultState = {
  kioskModeEnabled: false,
  kioskPasscode: '0000',
  kioskMaxInputLength: 200,
  kioskNgWords: [] as string[],
  kioskNgWordEnabled: false,
  kioskTemporaryUnlock: false,
}

jest.mock('@/features/stores/settings', () => {
  return {
    __esModule: true,
    default: Object.assign(jest.fn(), {
      setState: (...args: any[]) => mockSetState(...args),
      getState: () => defaultState,
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
  kioskModeEnabled: false,
  kioskPasscode: '0000',
  kioskMaxInputLength: 200,
  kioskNgWords: [] as string[],
  kioskNgWordEnabled: false,
  kioskTemporaryUnlock: false,
  ...overrides,
})

describe('KioskSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettingsStore.mockImplementation((selector) => {
      const state = createDefaultState()
      return selector(state as any)
    })
  })

  describe('Requirement 1.1, 1.2: デモ端末モードON/OFF', () => {
    it('should render the enable/disable toggle', () => {
      render(<KioskSettings />)
      expect(screen.getByText('KioskModeEnabled')).toBeInTheDocument()
    })

    it('should render toggle switches', () => {
      render(<KioskSettings />)
      // Check that toggle switches exist via their role
      const toggleButtons = screen.getAllByRole('switch')
      expect(toggleButtons.length).toBeGreaterThan(0)
    })

    it('should toggle kiosk mode when button is clicked', () => {
      render(<KioskSettings />)
      // First toggle is for kiosk mode enabled
      const toggleButtons = screen.getAllByRole('switch')
      fireEvent.click(toggleButtons[0])
      expect(mockSetState).toHaveBeenCalled()
    })
  })

  describe('Requirement 3.4: パスコード設定', () => {
    it('should render passcode input field', () => {
      render(<KioskSettings />)
      expect(screen.getByText('KioskPasscode')).toBeInTheDocument()
    })

    it('should display passcode value', () => {
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskPasscode')
      expect(input).toHaveValue('0000')
    })

    it('should update passcode when changed', () => {
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskPasscode')
      fireEvent.change(input, { target: { value: '1234' } })
      // ローカルstate方式に変更: changeではstoreに保存しない
      // blurで保存される
      fireEvent.blur(input)
      expect(mockSetState).toHaveBeenCalledWith({ kioskPasscode: '1234' })
    })

    it('should show error message for invalid passcode', () => {
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskPasscode')
      fireEvent.change(input, { target: { value: '12' } })
      expect(screen.getByText('KioskPasscodeInvalid')).toBeInTheDocument()
    })

    it('should not save invalid passcode to store on blur', () => {
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskPasscode')
      fireEvent.change(input, { target: { value: '12' } })
      fireEvent.blur(input)
      // 無効なパスコードではstoreに保存されない（kioskPasscodeキーでの呼び出しがない）
      const passcodeCall = mockSetState.mock.calls.find(
        (call: any[]) => call[0] && 'kioskPasscode' in call[0]
      )
      expect(passcodeCall).toBeUndefined()
    })

    it('should save valid passcode to store on blur', () => {
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskPasscode')
      fireEvent.change(input, { target: { value: 'abcd1234' } })
      fireEvent.blur(input)
      expect(mockSetState).toHaveBeenCalledWith({ kioskPasscode: 'abcd1234' })
    })

    it('should clear error when valid passcode is entered', () => {
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskPasscode')
      // まず無効な値を入力
      fireEvent.change(input, { target: { value: '12' } })
      expect(screen.getByText('KioskPasscodeInvalid')).toBeInTheDocument()
      // 有効な値に修正
      fireEvent.change(input, { target: { value: '1234' } })
      expect(screen.queryByText('KioskPasscodeInvalid')).not.toBeInTheDocument()
    })
  })

  describe('Requirement 7.1: 入力文字数制限', () => {
    it('should render max input length input field', () => {
      render(<KioskSettings />)
      expect(screen.getByText('KioskMaxInputLength')).toBeInTheDocument()
    })

    it('should display max input length value', () => {
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskMaxInputLength')
      expect(input).toHaveValue(200)
    })

    it('should update max input length when changed', () => {
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskMaxInputLength')
      fireEvent.change(input, { target: { value: '300' } })
      expect(mockSetState).toHaveBeenCalledWith({ kioskMaxInputLength: 300 })
    })

    it('should clamp value to minimum 50 characters on blur', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({ kioskMaxInputLength: 10 })
        return selector(state as any)
      })
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskMaxInputLength')
      fireEvent.blur(input)
      expect(mockSetState).toHaveBeenCalledWith({ kioskMaxInputLength: 50 })
    })

    it('should clamp value to maximum 500 characters on blur', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({ kioskMaxInputLength: 1000 })
        return selector(state as any)
      })
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskMaxInputLength')
      fireEvent.blur(input)
      expect(mockSetState).toHaveBeenCalledWith({ kioskMaxInputLength: 500 })
    })
  })

  describe('Requirement 7.3: NGワード設定', () => {
    it('should render NG word filter toggle', () => {
      render(<KioskSettings />)
      expect(screen.getByText('KioskNgWordEnabled')).toBeInTheDocument()
    })

    it('should toggle NG word filter when button is clicked', () => {
      render(<KioskSettings />)
      const toggleButtons = screen.getAllByRole('switch')
      // Last toggle button is NG word filter
      fireEvent.click(toggleButtons[toggleButtons.length - 1])
      expect(mockSetState).toHaveBeenCalled()
    })

    it('should show NG words input when filter is enabled', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({ kioskNgWordEnabled: true })
        return selector(state as any)
      })
      render(<KioskSettings />)
      expect(screen.getByText('KioskNgWords')).toBeInTheDocument()
      expect(screen.getByLabelText('KioskNgWords')).toBeInTheDocument()
    })

    it('should not show NG words input when filter is disabled', () => {
      render(<KioskSettings />)
      expect(screen.queryByLabelText('KioskNgWords')).not.toBeInTheDocument()
    })

    it('should call setState when NG words input is blurred', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({
          kioskNgWordEnabled: true,
          kioskNgWords: [],
        })
        return selector(state as any)
      })
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskNgWords')
      fireEvent.change(input, { target: { value: 'bad, word, test' } })
      fireEvent.blur(input)
      // Check that setState was called with kioskNgWords
      const calls = mockSetState.mock.calls
      const ngWordsCall = calls.find(
        (call: any[]) => call[0] && 'kioskNgWords' in call[0]
      )
      expect(ngWordsCall).toBeDefined()
    })

    it('should display existing NG words as comma-separated string', () => {
      mockSettingsStore.mockImplementation((selector) => {
        const state = createDefaultState({
          kioskNgWordEnabled: true,
          kioskNgWords: ['foo', 'bar'],
        })
        return selector(state as any)
      })
      render(<KioskSettings />)
      const input = screen.getByLabelText('KioskNgWords')
      expect(input).toHaveValue('foo, bar')
    })
  })

  describe('Settings Header', () => {
    it('should render the settings header with title', () => {
      render(<KioskSettings />)
      expect(screen.getByText('KioskSettings')).toBeInTheDocument()
    })
  })
})
