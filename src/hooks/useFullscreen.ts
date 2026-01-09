/**
 * useFullscreen Hook
 *
 * Wrapper for Fullscreen API with state management
 * Used for kiosk mode fullscreen display
 */

import { useState, useCallback, useEffect, useMemo } from 'react'

export interface UseFullscreenReturn {
  // State
  isFullscreen: boolean
  isSupported: boolean

  // Actions
  requestFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
  toggle: () => Promise<void>
}

/**
 * Check if Fullscreen API is supported
 */
function checkFullscreenSupport(): boolean {
  if (typeof document === 'undefined') return false
  return typeof document.documentElement?.requestFullscreen === 'function'
}

/**
 * Get current fullscreen state
 */
function getFullscreenState(): boolean {
  if (typeof document === 'undefined') return false
  return document.fullscreenElement !== null
}

/**
 * Fullscreen API wrapper hook
 */
export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(() => getFullscreenState())
  const isSupported = useMemo(() => checkFullscreenSupport(), [])

  // Sync state with fullscreenchange event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(getFullscreenState())
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Request fullscreen
  const requestFullscreen = useCallback(async () => {
    if (!isSupported) return

    try {
      await document.documentElement.requestFullscreen()
    } catch (error) {
      // Fullscreen request may fail due to user gesture requirements
      console.warn('Fullscreen request failed:', error)
    }
  }, [isSupported])

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) return

    try {
      await document.exitFullscreen()
    } catch (error) {
      console.warn('Exit fullscreen failed:', error)
    }
  }, [])

  // Toggle fullscreen
  const toggle = useCallback(async () => {
    if (document.fullscreenElement) {
      await exitFullscreen()
    } else {
      await requestFullscreen()
    }
  }, [requestFullscreen, exitFullscreen])

  return useMemo(
    () => ({
      isFullscreen,
      isSupported,
      requestFullscreen,
      exitFullscreen,
      toggle,
    }),
    [isFullscreen, isSupported, requestFullscreen, exitFullscreen, toggle]
  )
}
