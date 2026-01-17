/**
 * useKioskMode Hook
 *
 * Provides kiosk mode state management and input validation
 * Used for digital signage and exhibition displays
 */

import { useCallback, useMemo } from 'react'
import settingsStore from '@/features/stores/settings'

export interface ValidationResult {
  valid: boolean
  reason?: string
}

export interface UseKioskModeReturn {
  // State
  isKioskMode: boolean
  isTemporaryUnlocked: boolean
  canAccessSettings: boolean

  // Actions
  temporaryUnlock: () => void
  lockAgain: () => void

  // Input validation
  validateInput: (text: string) => ValidationResult
  maxInputLength: number | undefined
}

/**
 * Kiosk mode state management hook
 */
export function useKioskMode(): UseKioskModeReturn {
  // Get settings from store
  const kioskModeEnabled = settingsStore((s) => s.kioskModeEnabled)
  const kioskTemporaryUnlock = settingsStore((s) => s.kioskTemporaryUnlock)
  const kioskMaxInputLength = settingsStore((s) => s.kioskMaxInputLength)
  const kioskNgWords = settingsStore((s) => s.kioskNgWords)
  const kioskNgWordEnabled = settingsStore((s) => s.kioskNgWordEnabled)

  // Derived state
  const canAccessSettings = !kioskModeEnabled || kioskTemporaryUnlock
  const maxInputLength = kioskModeEnabled ? kioskMaxInputLength : undefined

  // Temporary unlock action
  const temporaryUnlock = useCallback(() => {
    settingsStore.setState({ kioskTemporaryUnlock: true })
  }, [])

  // Lock again action
  const lockAgain = useCallback(() => {
    settingsStore.setState({ kioskTemporaryUnlock: false })
  }, [])

  // Input validation
  const validateInput = useCallback(
    (text: string): ValidationResult => {
      // Skip validation when kiosk mode is disabled
      if (!kioskModeEnabled) {
        return { valid: true }
      }

      // Allow empty input
      if (text.length === 0) {
        return { valid: true }
      }

      // Validate and get safe max length value
      const maxLen =
        Number.isFinite(kioskMaxInputLength) && kioskMaxInputLength > 0
          ? kioskMaxInputLength
          : 200 // Default fallback

      // Check max length
      if (text.length > maxLen) {
        return {
          valid: false,
          reason: `入力は${maxLen}文字以内で入力してください`,
        }
      }

      // Check NG words (case-insensitive)
      if (kioskNgWordEnabled && kioskNgWords.length > 0) {
        const lowerText = text.toLowerCase()
        const foundNgWord = kioskNgWords.find((word) =>
          lowerText.includes(word.toLowerCase())
        )

        if (foundNgWord) {
          return {
            valid: false,
            reason: '不適切な内容が含まれています',
          }
        }
      }

      return { valid: true }
    },
    [kioskModeEnabled, kioskMaxInputLength, kioskNgWordEnabled, kioskNgWords]
  )

  return useMemo(
    () => ({
      isKioskMode: kioskModeEnabled,
      isTemporaryUnlocked: kioskTemporaryUnlock,
      canAccessSettings,
      temporaryUnlock,
      lockAgain,
      validateInput,
      maxInputLength,
    }),
    [
      kioskModeEnabled,
      kioskTemporaryUnlock,
      canAccessSettings,
      temporaryUnlock,
      lockAgain,
      validateInput,
      maxInputLength,
    ]
  )
}
