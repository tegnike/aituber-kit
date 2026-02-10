import {
  getLockoutState,
  setLockoutState,
  clearLockoutState,
  isLockedOut,
  KioskLockoutState,
} from '@/features/kiosk/kioskLockout'

const LOCKOUT_STORAGE_KEY = 'aituber-kiosk-lockout'

describe('kioskLockout', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
  })

  describe('getLockoutState', () => {
    it('returns default state when localStorage is empty', () => {
      const state = getLockoutState()
      expect(state).toEqual({ lockoutUntil: null, totalFailures: 0 })
    })

    it('reads state from localStorage', () => {
      const stored: KioskLockoutState = {
        lockoutUntil: 1234567890,
        totalFailures: 5,
      }
      localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(stored))

      const state = getLockoutState()
      expect(state).toEqual(stored)
    })

    it('returns default state on parse error', () => {
      localStorage.setItem(LOCKOUT_STORAGE_KEY, 'invalid-json')

      const state = getLockoutState()
      expect(state).toEqual({ lockoutUntil: null, totalFailures: 0 })
    })
  })

  describe('setLockoutState', () => {
    it('saves state to localStorage', () => {
      const state: KioskLockoutState = {
        lockoutUntil: 9999999999999,
        totalFailures: 3,
      }
      setLockoutState(state)

      const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY)
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw!)).toEqual(state)
    })
  })

  describe('clearLockoutState', () => {
    it('removes state from localStorage', () => {
      localStorage.setItem(
        LOCKOUT_STORAGE_KEY,
        '{"lockoutUntil":null,"totalFailures":1}'
      )
      clearLockoutState()

      expect(localStorage.getItem(LOCKOUT_STORAGE_KEY)).toBeNull()
    })
  })

  describe('isLockedOut', () => {
    it('returns true when lockoutUntil is in the future', () => {
      const futureTime = Date.now() + 60000
      setLockoutState({ lockoutUntil: futureTime, totalFailures: 3 })

      expect(isLockedOut()).toBe(true)
    })

    it('returns false when lockoutUntil is in the past', () => {
      const pastTime = Date.now() - 60000
      setLockoutState({ lockoutUntil: pastTime, totalFailures: 3 })

      expect(isLockedOut()).toBe(false)
    })

    it('returns false when lockoutUntil is null', () => {
      setLockoutState({ lockoutUntil: null, totalFailures: 3 })

      expect(isLockedOut()).toBe(false)
    })
  })

  describe('localStorage unavailable', () => {
    it('does not throw errors when localStorage throws', () => {
      const mockGetItem = jest
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('localStorage unavailable')
        })
      const mockSetItem = jest
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('localStorage unavailable')
        })
      const mockRemoveItem = jest
        .spyOn(Storage.prototype, 'removeItem')
        .mockImplementation(() => {
          throw new Error('localStorage unavailable')
        })

      expect(() => getLockoutState()).not.toThrow()
      expect(() =>
        setLockoutState({ lockoutUntil: null, totalFailures: 0 })
      ).not.toThrow()
      expect(() => clearLockoutState()).not.toThrow()
      expect(() => isLockedOut()).not.toThrow()

      expect(getLockoutState()).toEqual({
        lockoutUntil: null,
        totalFailures: 0,
      })
      expect(isLockedOut()).toBe(false)

      mockGetItem.mockRestore()
      mockSetItem.mockRestore()
      mockRemoveItem.mockRestore()
    })
  })
})
