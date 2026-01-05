/**
 * GuidanceMessage Component Tests
 *
 * Requirements: 6.1, 6.2, 6.3 - 操作誘導表示
 */

import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Import component after mocks
import { GuidanceMessage } from '@/features/kiosk/guidanceMessage'

describe('GuidanceMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders message when visible is true', () => {
      render(<GuidanceMessage message="話しかけてね！" visible={true} />)

      expect(screen.getByText('話しかけてね！')).toBeInTheDocument()
    })

    it('does not render message when visible is false', () => {
      render(<GuidanceMessage message="話しかけてね！" visible={false} />)

      expect(screen.queryByText('話しかけてね！')).not.toBeInTheDocument()
    })

    it('renders custom message', () => {
      render(<GuidanceMessage message="タップして開始" visible={true} />)

      expect(screen.getByText('タップして開始')).toBeInTheDocument()
    })
  })

  describe('Animation', () => {
    it('applies animation classes when visible', () => {
      render(<GuidanceMessage message="話しかけてね！" visible={true} />)

      const element = screen.getByTestId('guidance-message')
      expect(element).toHaveClass('animate-fade-in')
    })
  })

  describe('Dismiss callback', () => {
    it('calls onDismiss when provided and message is clicked', async () => {
      const onDismiss = jest.fn()

      render(
        <GuidanceMessage
          message="話しかけてね！"
          visible={true}
          onDismiss={onDismiss}
        />
      )

      await act(async () => {
        fireEvent.click(screen.getByText('話しかけてね！'))
      })

      expect(onDismiss).toHaveBeenCalled()
    })

    it('does not throw when onDismiss is not provided', async () => {
      render(<GuidanceMessage message="話しかけてね！" visible={true} />)

      await act(async () => {
        fireEvent.click(screen.getByText('話しかけてね！'))
      })

      // Should not throw
      expect(screen.getByText('話しかけてね！')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies centered position styling', () => {
      render(<GuidanceMessage message="話しかけてね！" visible={true} />)

      const element = screen.getByTestId('guidance-message')
      expect(element).toHaveClass('text-center')
    })

    it('applies large font size', () => {
      render(<GuidanceMessage message="話しかけてね！" visible={true} />)

      const element = screen.getByTestId('guidance-message')
      expect(element.className).toMatch(/text-(2xl|3xl|4xl)/)
    })
  })
})
