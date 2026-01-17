/**
 * useEscLongPress Hook Tests
 *
 * TDD tests for Escape key long press detection
 * Requirements: 3.1 - Escキー長押しでパスコードダイアログ表示
 */

import { renderHook, act } from '@testing-library/react'
import { useEscLongPress } from '@/hooks/useEscLongPress'

describe('useEscLongPress Hook', () => {
  const mockCallback = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Basic functionality', () => {
    it('should not trigger callback on short Escape key press', () => {
      renderHook(() => useEscLongPress(mockCallback))

      // Press Escape briefly (less than 2 seconds)
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      // Release before 2 seconds
      act(() => {
        jest.advanceTimersByTime(500)
      })

      act(() => {
        const keyupEvent = new KeyboardEvent('keyup', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keyupEvent)
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should trigger callback after 2 seconds of holding Escape key', () => {
      renderHook(() => useEscLongPress(mockCallback))

      // Press Escape
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      // Wait for 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should not trigger callback on other keys', () => {
      renderHook(() => useEscLongPress(mockCallback))

      // Press Enter (not Escape)
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      // Wait for 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('Configurable duration', () => {
    it('should accept custom duration', () => {
      renderHook(() => useEscLongPress(mockCallback, { duration: 3000 }))

      // Press Escape
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      // Wait for 2 seconds (should not trigger)
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockCallback).not.toHaveBeenCalled()

      // Wait for 1 more second (total 3 seconds)
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Enabled state', () => {
    it('should not trigger callback when disabled', () => {
      renderHook(() => useEscLongPress(mockCallback, { enabled: false }))

      // Press Escape
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      // Wait for 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should trigger callback when enabled', () => {
      renderHook(() => useEscLongPress(mockCallback, { enabled: true }))

      // Press Escape
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      // Wait for 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Repeated key events', () => {
    it('should only trigger once for repeated keydown events', () => {
      renderHook(() => useEscLongPress(mockCallback))

      // Simulate repeated keydown events (browser behavior when holding key)
      for (let i = 0; i < 5; i++) {
        act(() => {
          const keydownEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            repeat: i > 0,
          })
          window.dispatchEvent(keydownEvent)
        })
      }

      // Wait for 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = renderHook(() => useEscLongPress(mockCallback))

      unmount()

      // Press Escape after unmount
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      // Wait for 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should cancel timer when key is released', () => {
      renderHook(() => useEscLongPress(mockCallback))

      // Press Escape
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      // Wait for 1.5 seconds
      act(() => {
        jest.advanceTimersByTime(1500)
      })

      // Release key
      act(() => {
        const keyupEvent = new KeyboardEvent('keyup', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keyupEvent)
      })

      // Wait more time (should not trigger because key was released)
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('Returns isHolding state', () => {
    it('should indicate when Escape key is being held', () => {
      const { result } = renderHook(() => useEscLongPress(mockCallback))

      expect(result.current.isHolding).toBe(false)

      // Press Escape
      act(() => {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keydownEvent)
      })

      expect(result.current.isHolding).toBe(true)

      // Release Escape
      act(() => {
        const keyupEvent = new KeyboardEvent('keyup', {
          key: 'Escape',
          bubbles: true,
        })
        window.dispatchEvent(keyupEvent)
      })

      expect(result.current.isHolding).toBe(false)
    })
  })
})
