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
    return {
      lockoutUntil:
        typeof parsed.lockoutUntil === 'number' ? parsed.lockoutUntil : null,
      totalFailures:
        typeof parsed.totalFailures === 'number' ? parsed.totalFailures : 0,
    }
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
  try {
    const state = getLockoutState()
    return state.lockoutUntil !== null && state.lockoutUntil > Date.now()
  } catch {
    return false
  }
}
