/**
 * useMultiTap Hook
 *
 * Detects multiple consecutive taps on an element
 * Used to trigger passcode dialog in kiosk mode on touch devices
 */

import { useCallback, useEffect, useRef } from 'react'

interface UseMultiTapOptions {
  requiredTaps?: number // default: 5
  timeWindow?: number // default: 3000ms
  enabled?: boolean // default: true
}

interface UseMultiTapReturn {
  ref: React.RefObject<HTMLDivElement>
}

const DEFAULT_REQUIRED_TAPS = 5
const DEFAULT_TIME_WINDOW = 3000

export function useMultiTap(
  onMultiTap: () => void,
  options: UseMultiTapOptions = {}
): UseMultiTapReturn {
  const {
    requiredTaps = DEFAULT_REQUIRED_TAPS,
    timeWindow = DEFAULT_TIME_WINDOW,
    enabled = true,
  } = options

  const ref = useRef<HTMLDivElement>(null!)
  const tapTimestampsRef = useRef<number[]>([])

  const handleClick = useCallback(() => {
    if (!enabled) return

    const now = Date.now()
    const cutoff = now - timeWindow

    // Keep only taps within the time window
    tapTimestampsRef.current = tapTimestampsRef.current.filter(
      (ts) => ts > cutoff
    )

    tapTimestampsRef.current.push(now)

    if (tapTimestampsRef.current.length >= requiredTaps) {
      tapTimestampsRef.current = []
      onMultiTap()
    }
  }, [enabled, requiredTaps, timeWindow, onMultiTap])

  useEffect(() => {
    if (!enabled) return

    const element = ref.current
    if (!element) return

    element.addEventListener('click', handleClick)

    return () => {
      element.removeEventListener('click', handleClick)
      tapTimestampsRef.current = []
    }
  }, [enabled, handleClick])

  return { ref }
}
