/**
 * Error Handling Tests for Hooks
 *
 * 各種フックのエラー処理テスト
 */

import { renderHook, act } from '@testing-library/react'

// Mock useRestrictedMode
jest.mock('@/utils/restrictedMode', () => ({
  isRestrictedMode: jest.fn(() => false),
}))

jest.mock('@/hooks/useRestrictedMode', () => ({
  useRestrictedMode: jest.fn(() => ({ isRestrictedMode: false })),
}))

// Mock settingsStore
jest.mock('@/features/stores/settings', () => ({
  __esModule: true,
  default: Object.assign(
    jest.fn((selector) => {
      const state = {
        kioskModeEnabled: false,
        kioskPasscode: '0000',
        kioskTemporaryUnlock: false,
        kioskMaxInputLength: 200,
        kioskNgWords: [],
        kioskNgWordEnabled: false,
        kioskGuidanceMessage: '',
        kioskGuidanceTimeout: 20,
      }
      return selector(state as any)
    }),
    {
      getState: jest.fn(() => ({
        kioskModeEnabled: false,
        kioskTemporaryUnlock: false,
      })),
      setState: jest.fn(),
    }
  ),
}))

import { useKioskMode } from '@/hooks/useKioskMode'

describe('Error Handling in Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useKioskMode error handling', () => {
    it('should handle validateInput with empty string', () => {
      const { result } = renderHook(() => useKioskMode())

      const validation = result.current.validateInput('')
      expect(validation.valid).toBe(true)
    })

    it('should handle validateInput with very long strings', () => {
      const settingsStore = require('@/features/stores/settings').default
      settingsStore.mockImplementation((selector: any) => {
        const state = {
          kioskModeEnabled: true,
          kioskPasscode: '0000',
          kioskTemporaryUnlock: false,
          kioskMaxInputLength: 10,
          kioskNgWords: [],
          kioskNgWordEnabled: false,
          kioskGuidanceMessage: '',
          kioskGuidanceTimeout: 20,
        }
        return selector(state as any)
      })

      const { result } = renderHook(() => useKioskMode())

      const validation = result.current.validateInput('a'.repeat(100))
      expect(validation.valid).toBe(false)
    })

    it('should handle temporaryUnlock without errors', () => {
      const settingsStore = require('@/features/stores/settings').default
      settingsStore.mockImplementation((selector: any) => {
        const state = {
          kioskModeEnabled: true,
          kioskPasscode: '1234',
          kioskTemporaryUnlock: false,
          kioskMaxInputLength: 200,
          kioskNgWords: [],
          kioskNgWordEnabled: false,
          kioskGuidanceMessage: '',
          kioskGuidanceTimeout: 20,
        }
        return selector(state as any)
      })

      const { result } = renderHook(() => useKioskMode())

      expect(() => {
        act(() => {
          result.current.temporaryUnlock()
        })
      }).not.toThrow()
    })

    it('should handle lockAgain without errors', () => {
      const settingsStore = require('@/features/stores/settings').default
      settingsStore.mockImplementation((selector: any) => {
        const state = {
          kioskModeEnabled: true,
          kioskPasscode: '1234',
          kioskTemporaryUnlock: true,
          kioskMaxInputLength: 200,
          kioskNgWords: [],
          kioskNgWordEnabled: false,
          kioskGuidanceMessage: '',
          kioskGuidanceTimeout: 20,
        }
        return selector(state as any)
      })

      const { result } = renderHook(() => useKioskMode())

      expect(() => {
        act(() => {
          result.current.lockAgain()
        })
      }).not.toThrow()
    })
  })
})
