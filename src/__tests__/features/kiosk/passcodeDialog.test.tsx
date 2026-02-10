/**
 * PasscodeDialog Component Tests
 *
 * TDD tests for passcode unlock functionality
 * Requirements: 3.1, 3.2, 3.3 - パスコード解除機能
 */

import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  PasscodeDialog,
  PasscodeDialogProps,
} from '@/features/kiosk/passcodeDialog'

// Helper function to type text into an input
const typeText = (input: HTMLElement, text: string) => {
  fireEvent.change(input, { target: { value: text } })
}

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      const translations: Record<string, string> = {
        'Kiosk.PasscodeTitle': 'パスコードを入力',
        'Kiosk.PasscodeIncorrect': 'パスコードが違います',
        'Kiosk.PasscodeLocked': 'ロック中',
        'Kiosk.PasscodeRemainingAttempts': '残り{{count}}回',
        'Kiosk.Cancel': 'キャンセル',
        'Kiosk.Unlock': '解除',
      }
      let result = translations[key] || key
      // Replace {{count}} with actual value
      if (options?.count !== undefined) {
        result = result.replace('{{count}}', String(options.count))
      }
      return result
    },
  }),
}))

describe('PasscodeDialog Component', () => {
  const defaultProps: PasscodeDialogProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    correctPasscode: '1234',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Requirement 3.1: パスコード入力UI', () => {
    it('should render passcode input dialog when isOpen is true', () => {
      render(<PasscodeDialog {...defaultProps} />)

      expect(screen.getByText('パスコードを入力')).toBeInTheDocument()
    })

    it('should not render dialog when isOpen is false', () => {
      render(<PasscodeDialog {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('パスコードを入力')).not.toBeInTheDocument()
    })

    it('should have a passcode input field', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('should have cancel and unlock buttons', () => {
      render(<PasscodeDialog {...defaultProps} />)

      expect(screen.getByText('キャンセル')).toBeInTheDocument()
      expect(screen.getByText('解除')).toBeInTheDocument()
    })

    it('should call onClose when cancel button is clicked', () => {
      const onClose = jest.fn()
      render(<PasscodeDialog {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByText('キャンセル'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Requirement 3.2: パスコード検証', () => {
    it('should call onSuccess when correct passcode is entered', () => {
      const onSuccess = jest.fn()
      render(<PasscodeDialog {...defaultProps} onSuccess={onSuccess} />)

      const input = screen.getByRole('textbox')
      typeText(input, '1234')

      fireEvent.click(screen.getByText('解除'))

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should show error message when incorrect passcode is entered', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')
      typeText(input, '0000')

      fireEvent.click(screen.getByText('解除'))

      expect(screen.getByText('パスコードが違います')).toBeInTheDocument()
    })

    it('should NOT call onSuccess when incorrect passcode is entered', () => {
      const onSuccess = jest.fn()
      render(<PasscodeDialog {...defaultProps} onSuccess={onSuccess} />)

      const input = screen.getByRole('textbox')
      typeText(input, '0000')

      fireEvent.click(screen.getByText('解除'))

      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('should clear input after failed attempt', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      typeText(input, '0000')

      fireEvent.click(screen.getByText('解除'))

      expect(input.value).toBe('')
    })

    it('should support alphanumeric passcodes', () => {
      const onSuccess = jest.fn()
      render(
        <PasscodeDialog
          {...defaultProps}
          correctPasscode="abc123"
          onSuccess={onSuccess}
        />
      )

      const input = screen.getByRole('textbox')
      typeText(input, 'abc123')

      fireEvent.click(screen.getByText('解除'))

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  describe('Requirement 3.3: ロックアウト機能', () => {
    it('should show remaining attempts after first failure', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')
      typeText(input, '0000')
      fireEvent.click(screen.getByText('解除'))

      expect(screen.getByText(/残り2回/)).toBeInTheDocument()
    })

    it('should show remaining attempts after second failure', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')

      // First attempt
      typeText(input, '0000')
      fireEvent.click(screen.getByText('解除'))

      // Second attempt
      typeText(input, '1111')
      fireEvent.click(screen.getByText('解除'))

      expect(screen.getByText(/残り1回/)).toBeInTheDocument()
    })

    it('should lock input after 3 failed attempts', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')

      // Three failed attempts
      for (let i = 0; i < 3; i++) {
        typeText(input, '0000')
        fireEvent.click(screen.getByText('解除'))
      }

      // Input should be disabled
      expect(input).toBeDisabled()
    })

    it('should show lockout message with countdown', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')

      // Three failed attempts
      for (let i = 0; i < 3; i++) {
        typeText(input, '0000')
        fireEvent.click(screen.getByText('解除'))
      }

      expect(screen.getByText(/ロック中/)).toBeInTheDocument()
    })

    it('should disable unlock button during lockout', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')

      // Three failed attempts
      for (let i = 0; i < 3; i++) {
        typeText(input, '0000')
        fireEvent.click(screen.getByText('解除'))
      }

      expect(screen.getByText('解除').closest('button')).toBeDisabled()
    })

    it('should unlock after 30 seconds', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')

      // Three failed attempts
      for (let i = 0; i < 3; i++) {
        typeText(input, '0000')
        fireEvent.click(screen.getByText('解除'))
      }

      // Advance timers by 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000)
      })

      // Input should be enabled again
      expect(input).not.toBeDisabled()
    })

    it('should show countdown timer during lockout', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')

      // Three failed attempts
      for (let i = 0; i < 3; i++) {
        typeText(input, '0000')
        fireEvent.click(screen.getByText('解除'))
      }

      // Should show initial countdown (30 seconds)
      expect(screen.getByText(/30/)).toBeInTheDocument()

      // Advance timer by 1 second
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Should show updated countdown (29 seconds)
      expect(screen.getByText(/29/)).toBeInTheDocument()
    })

    it('should reset attempt count after successful unlock', () => {
      // Start with fresh component
      const { rerender } = render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')

      // Two failed attempts
      for (let i = 0; i < 2; i++) {
        typeText(input, '0000')
        fireEvent.click(screen.getByText('解除'))
      }

      // Successful attempt
      typeText(input, '1234')
      fireEvent.click(screen.getByText('解除'))

      // Close and reopen dialog
      rerender(<PasscodeDialog {...defaultProps} isOpen={false} />)
      rerender(<PasscodeDialog {...defaultProps} isOpen={true} />)

      // Should not show remaining attempts (reset)
      expect(screen.queryByText(/残り/)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility and UX', () => {
    it('should focus input when dialog opens', async () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')
      await waitFor(() => {
        expect(document.activeElement).toBe(input)
      })
    })

    it('should close dialog when pressing Escape', async () => {
      const onClose = jest.fn()
      render(<PasscodeDialog {...defaultProps} onClose={onClose} />)

      // Wait for 500ms delay before Escape is allowed
      act(() => {
        jest.advanceTimersByTime(500)
      })

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should submit when pressing Enter', () => {
      const onSuccess = jest.fn()
      render(<PasscodeDialog {...defaultProps} onSuccess={onSuccess} />)

      const input = screen.getByRole('textbox')
      typeText(input, '1234')
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should mask input characters for security', () => {
      render(<PasscodeDialog {...defaultProps} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'password')
    })
  })
})
