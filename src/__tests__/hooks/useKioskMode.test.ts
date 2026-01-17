/**
 * useKioskMode Hook Tests
 *
 * TDD: Tests for kiosk mode state management hook
 */

import { renderHook, act } from '@testing-library/react'
import { useKioskMode } from '@/hooks/useKioskMode'
import settingsStore from '@/features/stores/settings'
import { DEFAULT_KIOSK_CONFIG } from '@/features/kiosk/kioskTypes'

describe('useKioskMode', () => {
  // Reset store to default values before each test
  beforeEach(() => {
    settingsStore.setState({
      kioskModeEnabled: DEFAULT_KIOSK_CONFIG.kioskModeEnabled,
      kioskPasscode: DEFAULT_KIOSK_CONFIG.kioskPasscode,
      kioskGuidanceMessage: DEFAULT_KIOSK_CONFIG.kioskGuidanceMessage,
      kioskGuidanceTimeout: DEFAULT_KIOSK_CONFIG.kioskGuidanceTimeout,
      kioskMaxInputLength: DEFAULT_KIOSK_CONFIG.kioskMaxInputLength,
      kioskNgWords: DEFAULT_KIOSK_CONFIG.kioskNgWords,
      kioskNgWordEnabled: DEFAULT_KIOSK_CONFIG.kioskNgWordEnabled,
      kioskTemporaryUnlock: DEFAULT_KIOSK_CONFIG.kioskTemporaryUnlock,
    })
  })

  describe('isKioskMode', () => {
    it('should return false when kiosk mode is disabled', () => {
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.isKioskMode).toBe(false)
    })

    it('should return true when kiosk mode is enabled', () => {
      settingsStore.setState({ kioskModeEnabled: true })
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.isKioskMode).toBe(true)
    })
  })

  describe('isTemporaryUnlocked', () => {
    it('should return false when not temporarily unlocked', () => {
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.isTemporaryUnlocked).toBe(false)
    })

    it('should return true when temporarily unlocked', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskTemporaryUnlock: true,
      })
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.isTemporaryUnlocked).toBe(true)
    })
  })

  describe('canAccessSettings', () => {
    it('should allow settings access when kiosk mode is disabled', () => {
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.canAccessSettings).toBe(true)
    })

    it('should deny settings access when kiosk mode is enabled and not unlocked', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskTemporaryUnlock: false,
      })
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.canAccessSettings).toBe(false)
    })

    it('should allow settings access when kiosk mode is enabled but temporarily unlocked', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskTemporaryUnlock: true,
      })
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.canAccessSettings).toBe(true)
    })
  })

  describe('maxInputLength', () => {
    it('should return configured max input length when kiosk mode is enabled', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 150,
      })
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.maxInputLength).toBe(150)
    })

    it('should return undefined when kiosk mode is disabled', () => {
      const { result } = renderHook(() => useKioskMode())
      expect(result.current.maxInputLength).toBeUndefined()
    })
  })

  describe('validateInput', () => {
    it('should return valid for any input when kiosk mode is disabled', () => {
      const { result } = renderHook(() => useKioskMode())

      const validation = result.current.validateInput('any text')
      expect(validation.valid).toBe(true)
      expect(validation.reason).toBeUndefined()
    })

    it('should return invalid when input exceeds max length', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 10,
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('12345678901') // 11 chars

      expect(validation.valid).toBe(false)
      expect(validation.reason).toBeDefined()
    })

    it('should return valid when input is within max length', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 10,
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('1234567890') // exactly 10

      expect(validation.valid).toBe(true)
    })

    it('should return invalid when input contains NG words', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: true,
        kioskNgWords: ['banned', 'forbidden'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput(
        'This contains banned word'
      )

      expect(validation.valid).toBe(false)
      expect(validation.reason).toBeDefined()
    })

    it('should return valid when NG words are disabled', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: false,
        kioskNgWords: ['banned'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput(
        'This contains banned word'
      )

      expect(validation.valid).toBe(true)
    })

    it('should check NG words case-insensitively', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: true,
        kioskNgWords: ['BANNED'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput(
        'This contains banned word'
      )

      expect(validation.valid).toBe(false)
    })

    it('should return valid for empty input', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: true,
        kioskNgWords: ['banned'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('')

      expect(validation.valid).toBe(true)
    })
  })

  describe('temporaryUnlock', () => {
    it('should set kioskTemporaryUnlock to true', () => {
      settingsStore.setState({ kioskModeEnabled: true })
      const { result } = renderHook(() => useKioskMode())

      act(() => {
        result.current.temporaryUnlock()
      })

      expect(settingsStore.getState().kioskTemporaryUnlock).toBe(true)
    })
  })

  describe('lockAgain', () => {
    it('should set kioskTemporaryUnlock to false', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskTemporaryUnlock: true,
      })
      const { result } = renderHook(() => useKioskMode())

      act(() => {
        result.current.lockAgain()
      })

      expect(settingsStore.getState().kioskTemporaryUnlock).toBe(false)
    })
  })
})
