/**
 * Presence Settings Tests
 *
 * TDD: Tests for presence detection settings in settings store
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 - 設定機能
 */

import settingsStore from '@/features/stores/settings'

// Default values from design document
const DEFAULT_PRESENCE_SETTINGS = {
  presenceDetectionEnabled: false,
  presenceGreetingMessage:
    'いらっしゃいませ！何かお手伝いできることはありますか？',
  presenceDepartureTimeout: 3,
  presenceCooldownTime: 5,
  presenceDetectionSensitivity: 'medium' as const,
  presenceDebugMode: false,
}

describe('Settings Store - Presence Detection Settings', () => {
  beforeEach(() => {
    // Reset store to default values
    settingsStore.setState({
      presenceDetectionEnabled:
        DEFAULT_PRESENCE_SETTINGS.presenceDetectionEnabled,
      presenceGreetingMessage:
        DEFAULT_PRESENCE_SETTINGS.presenceGreetingMessage,
      presenceDepartureTimeout:
        DEFAULT_PRESENCE_SETTINGS.presenceDepartureTimeout,
      presenceCooldownTime: DEFAULT_PRESENCE_SETTINGS.presenceCooldownTime,
      presenceDetectionSensitivity:
        DEFAULT_PRESENCE_SETTINGS.presenceDetectionSensitivity,
      presenceDebugMode: DEFAULT_PRESENCE_SETTINGS.presenceDebugMode,
    })
  })

  describe('presenceDetectionEnabled', () => {
    it('should default to false', () => {
      const state = settingsStore.getState()
      expect(state.presenceDetectionEnabled).toBe(false)
    })

    it('should be updatable', () => {
      settingsStore.setState({ presenceDetectionEnabled: true })
      expect(settingsStore.getState().presenceDetectionEnabled).toBe(true)

      settingsStore.setState({ presenceDetectionEnabled: false })
      expect(settingsStore.getState().presenceDetectionEnabled).toBe(false)
    })
  })

  describe('presenceGreetingMessage', () => {
    it('should have a default greeting message', () => {
      const state = settingsStore.getState()
      expect(state.presenceGreetingMessage).toBe(
        'いらっしゃいませ！何かお手伝いできることはありますか？'
      )
    })

    it('should be customizable', () => {
      const customMessage = 'ようこそ！今日はどのようなご用件ですか？'
      settingsStore.setState({ presenceGreetingMessage: customMessage })
      expect(settingsStore.getState().presenceGreetingMessage).toBe(
        customMessage
      )
    })

    it('should allow empty message', () => {
      settingsStore.setState({ presenceGreetingMessage: '' })
      expect(settingsStore.getState().presenceGreetingMessage).toBe('')
    })
  })

  describe('presenceDepartureTimeout', () => {
    it('should default to 3 seconds', () => {
      const state = settingsStore.getState()
      expect(state.presenceDepartureTimeout).toBe(3)
    })

    it('should be updatable within valid range (1-10 seconds)', () => {
      settingsStore.setState({ presenceDepartureTimeout: 1 })
      expect(settingsStore.getState().presenceDepartureTimeout).toBe(1)

      settingsStore.setState({ presenceDepartureTimeout: 10 })
      expect(settingsStore.getState().presenceDepartureTimeout).toBe(10)

      settingsStore.setState({ presenceDepartureTimeout: 5 })
      expect(settingsStore.getState().presenceDepartureTimeout).toBe(5)
    })
  })

  describe('presenceCooldownTime', () => {
    it('should default to 5 seconds', () => {
      const state = settingsStore.getState()
      expect(state.presenceCooldownTime).toBe(5)
    })

    it('should be updatable within valid range (0-30 seconds)', () => {
      settingsStore.setState({ presenceCooldownTime: 0 })
      expect(settingsStore.getState().presenceCooldownTime).toBe(0)

      settingsStore.setState({ presenceCooldownTime: 30 })
      expect(settingsStore.getState().presenceCooldownTime).toBe(30)

      settingsStore.setState({ presenceCooldownTime: 15 })
      expect(settingsStore.getState().presenceCooldownTime).toBe(15)
    })
  })

  describe('presenceDetectionSensitivity', () => {
    it('should default to medium', () => {
      const state = settingsStore.getState()
      expect(state.presenceDetectionSensitivity).toBe('medium')
    })

    it('should be updatable to low', () => {
      settingsStore.setState({ presenceDetectionSensitivity: 'low' })
      expect(settingsStore.getState().presenceDetectionSensitivity).toBe('low')
    })

    it('should be updatable to high', () => {
      settingsStore.setState({ presenceDetectionSensitivity: 'high' })
      expect(settingsStore.getState().presenceDetectionSensitivity).toBe('high')
    })
  })

  describe('presenceDebugMode', () => {
    it('should default to false', () => {
      const state = settingsStore.getState()
      expect(state.presenceDebugMode).toBe(false)
    })

    it('should be updatable', () => {
      settingsStore.setState({ presenceDebugMode: true })
      expect(settingsStore.getState().presenceDebugMode).toBe(true)

      settingsStore.setState({ presenceDebugMode: false })
      expect(settingsStore.getState().presenceDebugMode).toBe(false)
    })
  })

  describe('persistence', () => {
    it('should include all presence settings in state', () => {
      settingsStore.setState({
        presenceDetectionEnabled: true,
        presenceGreetingMessage: 'カスタムメッセージ',
        presenceDepartureTimeout: 5,
        presenceCooldownTime: 10,
        presenceDetectionSensitivity: 'high',
        presenceDebugMode: true,
      })

      const state = settingsStore.getState()
      expect(state.presenceDetectionEnabled).toBe(true)
      expect(state.presenceGreetingMessage).toBe('カスタムメッセージ')
      expect(state.presenceDepartureTimeout).toBe(5)
      expect(state.presenceCooldownTime).toBe(10)
      expect(state.presenceDetectionSensitivity).toBe('high')
      expect(state.presenceDebugMode).toBe(true)
    })
  })
})
