/**
 * useEscLongPress Hook
 *
 * Detects long press of the Escape key
 * Used to trigger passcode dialog in kiosk mode
 * Requirements: 3.1 - Escキー長押しでパスコードダイアログ表示
 */

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseEscLongPressOptions {
  duration?: number // milliseconds, default 2000
  enabled?: boolean // default true
}

interface UseEscLongPressReturn {
  isHolding: boolean
}

const DEFAULT_DURATION = 2000 // 2 seconds

export function useEscLongPress(
  onLongPress: () => void,
  options: UseEscLongPressOptions = {}
): UseEscLongPressReturn {
  const { duration = DEFAULT_DURATION, enabled = true } = options

  const [isHolding, setIsHolding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isKeyDownRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Escape key
      if (e.key !== 'Escape') return

      // Ignore repeated keydown events (browser sends these when holding key)
      if (e.repeat || isKeyDownRef.current) return

      isKeyDownRef.current = true
      setIsHolding(true)

      // Start timer
      clearTimer()
      timerRef.current = setTimeout(() => {
        onLongPress()
        timerRef.current = null
      }, duration)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Only handle Escape key
      if (e.key !== 'Escape') return

      isKeyDownRef.current = false
      setIsHolding(false)
      clearTimer()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      clearTimer()
      isKeyDownRef.current = false
      setIsHolding(false)
    }
  }, [enabled, duration, onLongPress, clearTimer])

  return { isHolding }
}
