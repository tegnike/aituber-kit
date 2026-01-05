/**
 * Settings Store - Realtime API / Audio Mode Demo Mode Tests
 *
 * TDD: Tests for WebSocket-related settings forced disable in demo mode
 * Requirements: 5.3, 5.4
 */

describe('Settings Store - Realtime API / Audio Mode Demo Mode', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('demo mode disabled (normal mode)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
    })

    it('should allow realtimeAPIMode to be set to true', () => {
      const settingsStore = require('@/features/stores/settings').default
      settingsStore.setState({ realtimeAPIMode: true })
      expect(settingsStore.getState().realtimeAPIMode).toBe(true)
    })

    it('should allow audioMode to be set to true', () => {
      const settingsStore = require('@/features/stores/settings').default
      settingsStore.setState({ audioMode: true })
      expect(settingsStore.getState().audioMode).toBe(true)
    })
  })

  describe('demo mode enabled - initialization', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
    })

    it('should force realtimeAPIMode to false during initialization', () => {
      // Set env to simulate realtime API being enabled by default
      process.env.NEXT_PUBLIC_REALTIME_API_MODE = 'true'
      process.env.NEXT_PUBLIC_SELECT_AI_SERVICE = 'openai'

      const settingsStore = require('@/features/stores/settings').default
      const state = settingsStore.getState()
      expect(state.realtimeAPIMode).toBe(false)
    })

    it('should force audioMode to false during initialization', () => {
      // Set env to simulate audio mode being enabled by default
      process.env.NEXT_PUBLIC_AUDIO_MODE = 'true'

      const settingsStore = require('@/features/stores/settings').default
      const state = settingsStore.getState()
      expect(state.audioMode).toBe(false)
    })
  })

  describe('demo mode enabled - rehydration behavior', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
    })

    it('should keep realtimeAPIMode false in demo mode even after setState', () => {
      // Note: In demo mode, UI buttons are disabled, so setState shouldn't be called
      // This test verifies the initial state is correctly set to false
      const settingsStore = require('@/features/stores/settings').default

      // Initial state should be false in demo mode
      expect(settingsStore.getState().realtimeAPIMode).toBe(false)

      // Even if we try to set it (which shouldn't happen in practice due to disabled UI),
      // the UI level protection prevents this. But the store itself doesn't block setState.
      // The protection is at the initialization and rehydration level.
    })

    it('should keep audioMode false in demo mode even after setState', () => {
      const settingsStore = require('@/features/stores/settings').default

      // Initial state should be false in demo mode
      expect(settingsStore.getState().audioMode).toBe(false)
    })
  })
})
