/**
 * useMultiTap Hook Tests
 *
 * Tests for multi-tap detection on elements
 */

import { renderHook, act } from '@testing-library/react'
import { useMultiTap } from '@/hooks/useMultiTap'

describe('useMultiTap Hook', () => {
  const mockCallback = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  function createDivWithRef() {
    const div = document.createElement('div')
    document.body.appendChild(div)
    return div
  }

  function clickElement(element: HTMLElement) {
    act(() => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  }

  describe('Basic functionality', () => {
    it('should fire callback after requiredTaps (default 5) taps', () => {
      const div = createDivWithRef()

      const { unmount } = renderHook(() => {
        const result = useMultiTap(mockCallback)
        ;(result.ref as React.MutableRefObject<HTMLDivElement>).current = div
        return result
      })

      for (let i = 0; i < 5; i++) {
        clickElement(div)
      }

      expect(mockCallback).toHaveBeenCalledTimes(1)

      unmount()
      div.remove()
    })

    it('should not fire callback with fewer than requiredTaps taps within timeWindow', () => {
      const div = createDivWithRef()

      const { unmount } = renderHook(() => {
        const result = useMultiTap(mockCallback)
        ;(result.ref as React.MutableRefObject<HTMLDivElement>).current = div
        return result
      })

      for (let i = 0; i < 4; i++) {
        clickElement(div)
      }

      expect(mockCallback).not.toHaveBeenCalled()

      unmount()
      div.remove()
    })
  })

  describe('Time window', () => {
    it('should reset count when taps exceed timeWindow', () => {
      const div = createDivWithRef()

      const { unmount } = renderHook(() => {
        const result = useMultiTap(mockCallback)
        ;(result.ref as React.MutableRefObject<HTMLDivElement>).current = div
        return result
      })

      // Tap 3 times
      for (let i = 0; i < 3; i++) {
        clickElement(div)
      }

      // Advance time beyond the default 3000ms window
      act(() => {
        jest.advanceTimersByTime(3100)
      })

      // Tap 2 more times (total in window is now 2, not 5)
      for (let i = 0; i < 2; i++) {
        clickElement(div)
      }

      expect(mockCallback).not.toHaveBeenCalled()

      unmount()
      div.remove()
    })
  })

  describe('Enabled state', () => {
    it('should not fire callback when enabled is false', () => {
      const div = createDivWithRef()

      const { unmount } = renderHook(() => {
        const result = useMultiTap(mockCallback, { enabled: false })
        ;(result.ref as React.MutableRefObject<HTMLDivElement>).current = div
        return result
      })

      for (let i = 0; i < 5; i++) {
        clickElement(div)
      }

      expect(mockCallback).not.toHaveBeenCalled()

      unmount()
      div.remove()
    })
  })

  describe('Custom options', () => {
    it('should work with custom requiredTaps', () => {
      const div = createDivWithRef()

      const { unmount } = renderHook(() => {
        const result = useMultiTap(mockCallback, { requiredTaps: 3 })
        ;(result.ref as React.MutableRefObject<HTMLDivElement>).current = div
        return result
      })

      for (let i = 0; i < 3; i++) {
        clickElement(div)
      }

      expect(mockCallback).toHaveBeenCalledTimes(1)

      unmount()
      div.remove()
    })

    it('should work with custom timeWindow', () => {
      const div = createDivWithRef()

      const { unmount } = renderHook(() => {
        const result = useMultiTap(mockCallback, { timeWindow: 1000 })
        ;(result.ref as React.MutableRefObject<HTMLDivElement>).current = div
        return result
      })

      // Tap 3 times
      for (let i = 0; i < 3; i++) {
        clickElement(div)
      }

      // Advance beyond 1000ms custom window
      act(() => {
        jest.advanceTimersByTime(1100)
      })

      // Tap 2 more times
      for (let i = 0; i < 2; i++) {
        clickElement(div)
      }

      expect(mockCallback).not.toHaveBeenCalled()

      unmount()
      div.remove()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup event listener on unmount', () => {
      const div = createDivWithRef()

      const { unmount } = renderHook(() => {
        const result = useMultiTap(mockCallback)
        ;(result.ref as React.MutableRefObject<HTMLDivElement>).current = div
        return result
      })

      unmount()

      // Taps after unmount should not fire callback
      for (let i = 0; i < 5; i++) {
        clickElement(div)
      }

      expect(mockCallback).not.toHaveBeenCalled()

      div.remove()
    })
  })

  describe('Reset after fire', () => {
    it('should reset after firing and allow re-trigger', () => {
      const div = createDivWithRef()

      const { unmount } = renderHook(() => {
        const result = useMultiTap(mockCallback)
        ;(result.ref as React.MutableRefObject<HTMLDivElement>).current = div
        return result
      })

      // First trigger
      for (let i = 0; i < 5; i++) {
        clickElement(div)
      }

      expect(mockCallback).toHaveBeenCalledTimes(1)

      // Second trigger
      for (let i = 0; i < 5; i++) {
        clickElement(div)
      }

      expect(mockCallback).toHaveBeenCalledTimes(2)

      unmount()
      div.remove()
    })
  })

  describe('Returns ref', () => {
    it('should return a ref object', () => {
      const { result } = renderHook(() => useMultiTap(mockCallback))

      expect(result.current.ref).toBeDefined()
      expect(result.current.ref).toHaveProperty('current')
    })
  })
})
