/**
 * useFullscreen Hook Tests
 *
 * TDD: Tests for fullscreen API wrapper hook
 */

import { renderHook, act } from '@testing-library/react'
import { useFullscreen } from '@/hooks/useFullscreen'

describe('useFullscreen', () => {
  // Mock fullscreen API
  const mockRequestFullscreen = jest.fn().mockResolvedValue(undefined)
  const mockExitFullscreen = jest.fn().mockResolvedValue(undefined)
  let mockFullscreenElement: Element | null = null
  let fullscreenChangeHandler: ((event: Event) => void) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    mockFullscreenElement = null
    fullscreenChangeHandler = null

    // Mock document.documentElement.requestFullscreen
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: mockRequestFullscreen,
      writable: true,
      configurable: true,
    })

    // Mock document.exitFullscreen
    Object.defineProperty(document, 'exitFullscreen', {
      value: mockExitFullscreen,
      writable: true,
      configurable: true,
    })

    // Mock document.fullscreenElement
    Object.defineProperty(document, 'fullscreenElement', {
      get: () => mockFullscreenElement,
      configurable: true,
    })

    // Capture event listeners
    const originalAddEventListener = document.addEventListener
    jest
      .spyOn(document, 'addEventListener')
      .mockImplementation((type, listener) => {
        if (type === 'fullscreenchange') {
          fullscreenChangeHandler = listener as (event: Event) => void
        }
        originalAddEventListener.call(document, type, listener as EventListener)
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('isSupported', () => {
    it('should return true when fullscreen API is supported', () => {
      const { result } = renderHook(() => useFullscreen())
      expect(result.current.isSupported).toBe(true)
    })

    it('should return false when fullscreen API is not supported', () => {
      // Remove fullscreen support
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useFullscreen())
      expect(result.current.isSupported).toBe(false)
    })
  })

  describe('isFullscreen', () => {
    it('should return false when not in fullscreen', () => {
      const { result } = renderHook(() => useFullscreen())
      expect(result.current.isFullscreen).toBe(false)
    })

    it('should return true when in fullscreen', () => {
      mockFullscreenElement = document.documentElement

      const { result } = renderHook(() => useFullscreen())
      expect(result.current.isFullscreen).toBe(true)
    })

    it('should update when fullscreenchange event fires', () => {
      const { result } = renderHook(() => useFullscreen())
      expect(result.current.isFullscreen).toBe(false)

      // Simulate entering fullscreen
      act(() => {
        mockFullscreenElement = document.documentElement
        if (fullscreenChangeHandler) {
          fullscreenChangeHandler(new Event('fullscreenchange'))
        }
      })

      expect(result.current.isFullscreen).toBe(true)

      // Simulate exiting fullscreen
      act(() => {
        mockFullscreenElement = null
        if (fullscreenChangeHandler) {
          fullscreenChangeHandler(new Event('fullscreenchange'))
        }
      })

      expect(result.current.isFullscreen).toBe(false)
    })
  })

  describe('requestFullscreen', () => {
    it('should call requestFullscreen on document element', async () => {
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.requestFullscreen()
      })

      expect(mockRequestFullscreen).toHaveBeenCalled()
    })

    it('should do nothing when API is not supported', async () => {
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.requestFullscreen()
      })

      // Should not throw
      expect(mockRequestFullscreen).not.toHaveBeenCalled()
    })
  })

  describe('exitFullscreen', () => {
    it('should call exitFullscreen on document', async () => {
      mockFullscreenElement = document.documentElement
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.exitFullscreen()
      })

      expect(mockExitFullscreen).toHaveBeenCalled()
    })

    it('should do nothing when not in fullscreen', async () => {
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.exitFullscreen()
      })

      expect(mockExitFullscreen).not.toHaveBeenCalled()
    })
  })

  describe('toggle', () => {
    it('should enter fullscreen when not in fullscreen', async () => {
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.toggle()
      })

      expect(mockRequestFullscreen).toHaveBeenCalled()
      expect(mockExitFullscreen).not.toHaveBeenCalled()
    })

    it('should exit fullscreen when in fullscreen', async () => {
      mockFullscreenElement = document.documentElement
      const { result } = renderHook(() => useFullscreen())

      await act(async () => {
        await result.current.toggle()
      })

      expect(mockExitFullscreen).toHaveBeenCalled()
      expect(mockRequestFullscreen).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { unmount } = renderHook(() => useFullscreen())
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'fullscreenchange',
        expect.any(Function)
      )
    })
  })
})
