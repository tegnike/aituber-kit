/**
 * Kiosk Mode Types
 *
 * Type definitions and constants for the kiosk mode feature
 * Used for digital signage and exhibition displays
 */

// Kiosk mode settings interface
export interface KioskModeSettings {
  // Basic settings
  kioskModeEnabled: boolean
  kioskPasscode: string

  // Guidance settings (for digital signage)
  kioskGuidanceMessage?: string // Optional guidance message
  kioskGuidanceTimeout: number // Guidance timeout in seconds

  // Input restrictions
  kioskMaxInputLength: number // characters (50-500)
  kioskNgWords: string[] // NG word list
  kioskNgWordEnabled: boolean

  // Temporary unlock state (not persisted)
  kioskTemporaryUnlock: boolean
}

// Default configuration
export const DEFAULT_KIOSK_CONFIG: KioskModeSettings = {
  kioskModeEnabled: false,
  kioskPasscode: '0000',
  kioskGuidanceMessage: undefined,
  kioskGuidanceTimeout: 60,
  kioskMaxInputLength: 200,
  kioskNgWords: [],
  kioskNgWordEnabled: false,
  kioskTemporaryUnlock: false,
}

// Validation constants
export const KIOSK_MAX_INPUT_LENGTH_MIN = 50
export const KIOSK_MAX_INPUT_LENGTH_MAX = 500
export const KIOSK_PASSCODE_MIN_LENGTH = 4

// Validate and clamp max input length value
export function clampKioskMaxInputLength(value: number): number {
  if (value < KIOSK_MAX_INPUT_LENGTH_MIN) return KIOSK_MAX_INPUT_LENGTH_MIN
  if (value > KIOSK_MAX_INPUT_LENGTH_MAX) return KIOSK_MAX_INPUT_LENGTH_MAX
  return value
}

// Validate passcode format (at least 4 alphanumeric characters)
export function isValidPasscode(passcode: string): boolean {
  return (
    passcode.length >= KIOSK_PASSCODE_MIN_LENGTH &&
    /^[a-zA-Z0-9]+$/.test(passcode)
  )
}

// Parse NG words from comma-separated string
export function parseNgWords(input: string): string[] {
  return input
    .split(',')
    .map((word) => word.trim())
    .filter((word) => word.length > 0)
}
