/**
 * Form Input Validation Tests (Kiosk Mode)
 *
 * TDD: Tests for kiosk mode input restrictions in Form component
 * Requirements: 7.1, 7.2
 */

import { renderHook, act } from '@testing-library/react'
import { useKioskMode } from '@/hooks/useKioskMode'
import settingsStore from '@/features/stores/settings'
import { DEFAULT_KIOSK_CONFIG } from '@/features/kiosk/kioskTypes'

describe('Form Input Validation for Kiosk Mode', () => {
  beforeEach(() => {
    settingsStore.setState({
      kioskModeEnabled: DEFAULT_KIOSK_CONFIG.kioskModeEnabled,
      kioskPasscode: DEFAULT_KIOSK_CONFIG.kioskPasscode,
      kioskMaxInputLength: DEFAULT_KIOSK_CONFIG.kioskMaxInputLength,
      kioskNgWords: DEFAULT_KIOSK_CONFIG.kioskNgWords,
      kioskNgWordEnabled: DEFAULT_KIOSK_CONFIG.kioskNgWordEnabled,
      kioskTemporaryUnlock: DEFAULT_KIOSK_CONFIG.kioskTemporaryUnlock,
    })
  })

  describe('Maximum Input Length', () => {
    it('should return max input length when kiosk mode is enabled', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 100,
      })

      const { result } = renderHook(() => useKioskMode())
      expect(result.current.maxInputLength).toBe(100)
    })

    it('should return undefined when kiosk mode is disabled', () => {
      settingsStore.setState({
        kioskModeEnabled: false,
        kioskMaxInputLength: 100,
      })

      const { result } = renderHook(() => useKioskMode())
      expect(result.current.maxInputLength).toBeUndefined()
    })

    it('should return valid when input length equals max length', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 10,
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('1234567890') // exactly 10 chars

      expect(validation.valid).toBe(true)
    })

    it('should return invalid when input exceeds max length', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 10,
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('12345678901') // 11 chars

      expect(validation.valid).toBe(false)
      expect(validation.reason).toContain('10')
    })
  })

  describe('NG Word Filtering', () => {
    it('should block input containing NG words', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: true,
        kioskNgWords: ['spam', 'forbidden'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('This is spam content')

      expect(validation.valid).toBe(false)
      expect(validation.reason).toBe('不適切な内容が含まれています')
    })

    it('should allow input when NG word filtering is disabled', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: false,
        kioskNgWords: ['spam'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('This is spam content')

      expect(validation.valid).toBe(true)
    })

    it('should check NG words case-insensitively', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: true,
        kioskNgWords: ['SPAM'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('This is spam content')

      expect(validation.valid).toBe(false)
    })

    it('should allow input without NG words', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: true,
        kioskNgWords: ['spam', 'forbidden'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('This is normal content')

      expect(validation.valid).toBe(true)
    })

    it('should allow empty input', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskNgWordEnabled: true,
        kioskNgWords: ['spam'],
      })

      const { result } = renderHook(() => useKioskMode())
      const validation = result.current.validateInput('')

      expect(validation.valid).toBe(true)
    })
  })

  describe('Combined Validations', () => {
    it('should validate both max length and NG words', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskMaxInputLength: 50,
        kioskNgWordEnabled: true,
        kioskNgWords: ['bad'],
      })

      const { result } = renderHook(() => useKioskMode())

      // Valid input
      const valid = result.current.validateInput('Hello world')
      expect(valid.valid).toBe(true)

      // Too long
      const tooLong = result.current.validateInput('a'.repeat(51))
      expect(tooLong.valid).toBe(false)

      // Contains NG word
      const hasNgWord = result.current.validateInput('This is bad')
      expect(hasNgWord.valid).toBe(false)
    })

    it('should skip validation when kiosk mode is disabled', () => {
      settingsStore.setState({
        kioskModeEnabled: false,
        kioskMaxInputLength: 10,
        kioskNgWordEnabled: true,
        kioskNgWords: ['bad'],
      })

      const { result } = renderHook(() => useKioskMode())

      // Long input should be valid when kiosk mode is disabled
      const validation = result.current.validateInput('a'.repeat(100) + ' bad')
      expect(validation.valid).toBe(true)
    })
  })
})
