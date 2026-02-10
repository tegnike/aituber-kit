const LOCKOUT_STORAGE_KEY = 'aituber-kiosk-lockout'
export const RECOVERY_THRESHOLD = 10

export interface KioskLockoutState {
  lockoutUntil: number | null
  totalFailures: number
}

const DEFAULT_STATE: KioskLockoutState = {
  lockoutUntil: null,
  totalFailures: 0,
}

export function getLockoutState(): KioskLockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    const lockoutUntil =
      typeof parsed.lockoutUntil === 'number' &&
      Number.isFinite(parsed.lockoutUntil) &&
      parsed.lockoutUntil > 0
        ? parsed.lockoutUntil
        : null
    const totalFailures =
      typeof parsed.totalFailures === 'number' &&
      Number.isFinite(parsed.totalFailures) &&
      parsed.totalFailures >= 0
        ? Math.floor(parsed.totalFailures)
        : 0
    return { lockoutUntil, totalFailures }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function setLockoutState(state: KioskLockoutState): void {
  try {
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Silently fail for private browsing or quota exceeded
  }
}

export function clearLockoutState(): void {
  try {
    localStorage.removeItem(LOCKOUT_STORAGE_KEY)
  } catch {
    // Silently fail for private browsing
  }
}

export function isLockedOut(): boolean {
  const state = getLockoutState()
  return state.lockoutUntil !== null && state.lockoutUntil > Date.now()
}
