/**
 * Settings Store - Kiosk Mode Settings Tests
 *
 * TDD: Tests for kiosk mode configuration in settings store
 */

import settingsStore from '@/features/stores/settings'
import { DEFAULT_KIOSK_CONFIG } from '@/features/kiosk/kioskTypes'

describe('Settings Store - Kiosk Mode Settings', () => {
  beforeEach(() => {
    // Reset store to default values
    settingsStore.setState({
      kioskModeEnabled: DEFAULT_KIOSK_CONFIG.kioskModeEnabled,
      kioskPasscode: DEFAULT_KIOSK_CONFIG.kioskPasscode,
      kioskMaxInputLength: DEFAULT_KIOSK_CONFIG.kioskMaxInputLength,
      kioskNgWords: DEFAULT_KIOSK_CONFIG.kioskNgWords,
      kioskNgWordEnabled: DEFAULT_KIOSK_CONFIG.kioskNgWordEnabled,
      kioskTemporaryUnlock: DEFAULT_KIOSK_CONFIG.kioskTemporaryUnlock,
    })
  })

  describe('kioskModeEnabled', () => {
    it('should default to false', () => {
      const state = settingsStore.getState()
      expect(state.kioskModeEnabled).toBe(false)
    })

    it('should be updatable', () => {
      settingsStore.setState({ kioskModeEnabled: true })
      expect(settingsStore.getState().kioskModeEnabled).toBe(true)

      settingsStore.setState({ kioskModeEnabled: false })
      expect(settingsStore.getState().kioskModeEnabled).toBe(false)
    })
  })

  describe('kioskPasscode', () => {
    it('should default to "0000"', () => {
      const state = settingsStore.getState()
      expect(state.kioskPasscode).toBe('0000')
    })

    it('should be updatable', () => {
      settingsStore.setState({ kioskPasscode: '1234' })
      expect(settingsStore.getState().kioskPasscode).toBe('1234')
    })
  })

  describe('kioskMaxInputLength', () => {
    it('should default to 200', () => {
      const state = settingsStore.getState()
      expect(state.kioskMaxInputLength).toBe(200)
    })

    it('should be updatable', () => {
      settingsStore.setState({ kioskMaxInputLength: 100 })
      expect(settingsStore.getState().kioskMaxInputLength).toBe(100)
    })
  })

  describe('kioskNgWords', () => {
    it('should default to empty array', () => {
      const state = settingsStore.getState()
      expect(state.kioskNgWords).toEqual([])
    })

    it('should be updatable', () => {
      settingsStore.setState({ kioskNgWords: ['bad', 'word'] })
      expect(settingsStore.getState().kioskNgWords).toEqual(['bad', 'word'])
    })
  })

  describe('kioskNgWordEnabled', () => {
    it('should default to false', () => {
      const state = settingsStore.getState()
      expect(state.kioskNgWordEnabled).toBe(false)
    })

    it('should be updatable', () => {
      settingsStore.setState({ kioskNgWordEnabled: true })
      expect(settingsStore.getState().kioskNgWordEnabled).toBe(true)
    })
  })

  describe('kioskTemporaryUnlock', () => {
    it('should default to false', () => {
      const state = settingsStore.getState()
      expect(state.kioskTemporaryUnlock).toBe(false)
    })

    it('should be updatable', () => {
      settingsStore.setState({ kioskTemporaryUnlock: true })
      expect(settingsStore.getState().kioskTemporaryUnlock).toBe(true)

      settingsStore.setState({ kioskTemporaryUnlock: false })
      expect(settingsStore.getState().kioskTemporaryUnlock).toBe(false)
    })
  })

  describe('all default kiosk settings', () => {
    it('should have all default values from DEFAULT_KIOSK_CONFIG', () => {
      const state = settingsStore.getState()

      expect(state.kioskModeEnabled).toBe(DEFAULT_KIOSK_CONFIG.kioskModeEnabled)
      expect(state.kioskPasscode).toBe(DEFAULT_KIOSK_CONFIG.kioskPasscode)
      expect(state.kioskMaxInputLength).toBe(
        DEFAULT_KIOSK_CONFIG.kioskMaxInputLength
      )
      expect(state.kioskNgWords).toEqual(DEFAULT_KIOSK_CONFIG.kioskNgWords)
      expect(state.kioskNgWordEnabled).toBe(
        DEFAULT_KIOSK_CONFIG.kioskNgWordEnabled
      )
      expect(state.kioskTemporaryUnlock).toBe(
        DEFAULT_KIOSK_CONFIG.kioskTemporaryUnlock
      )
    })
  })

  describe('persistence', () => {
    it('should include kiosk mode settings in state', () => {
      settingsStore.setState({
        kioskModeEnabled: true,
        kioskPasscode: '5678',
        kioskMaxInputLength: 150,
        kioskNgWords: ['test', 'word'],
        kioskNgWordEnabled: true,
      })

      const state = settingsStore.getState()
      expect(state.kioskModeEnabled).toBe(true)
      expect(state.kioskPasscode).toBe('5678')
      expect(state.kioskMaxInputLength).toBe(150)
      expect(state.kioskNgWords).toEqual(['test', 'word'])
      expect(state.kioskNgWordEnabled).toBe(true)
    })
  })
})
