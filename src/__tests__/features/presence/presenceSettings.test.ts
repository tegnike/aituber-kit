/**
 * Presence Settings Tests
 *
 * TDD: Tests for presence detection settings in settings store
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 - 設定機能
 */

import settingsStore from '@/features/stores/settings'
import { createIdlePhrase } from '@/features/idle/idleTypes'

// Default values from design document
const DEFAULT_PRESENCE_SETTINGS = {
  presenceDetectionEnabled: false,
  presenceGreetingPhrases: [
    createIdlePhrase(
      'いらっしゃいませ！何かお手伝いできることはありますか？',
      'happy',
      0
    ),
  ],
  presenceDepartureTimeout: 10,
  presenceCooldownTime: 5,
  presenceDetectionSensitivity: 'medium' as const,
  presenceDetectionThreshold: 0,
  presenceDebugMode: false,
  presenceDeparturePhrases: [],
  presenceClearChatOnDeparture: true,
}

describe('Settings Store - Presence Detection Settings', () => {
  beforeEach(() => {
    // Reset store to default values
    settingsStore.setState({
      presenceDetectionEnabled:
        DEFAULT_PRESENCE_SETTINGS.presenceDetectionEnabled,
      presenceGreetingPhrases:
        DEFAULT_PRESENCE_SETTINGS.presenceGreetingPhrases,
      presenceDepartureTimeout:
        DEFAULT_PRESENCE_SETTINGS.presenceDepartureTimeout,
      presenceCooldownTime: DEFAULT_PRESENCE_SETTINGS.presenceCooldownTime,
      presenceDetectionSensitivity:
        DEFAULT_PRESENCE_SETTINGS.presenceDetectionSensitivity,
      presenceDetectionThreshold:
        DEFAULT_PRESENCE_SETTINGS.presenceDetectionThreshold,
      presenceDebugMode: DEFAULT_PRESENCE_SETTINGS.presenceDebugMode,
      presenceDeparturePhrases:
        DEFAULT_PRESENCE_SETTINGS.presenceDeparturePhrases,
      presenceClearChatOnDeparture:
        DEFAULT_PRESENCE_SETTINGS.presenceClearChatOnDeparture,
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

  describe('presenceGreetingPhrases', () => {
    it('should have a default greeting phrase', () => {
      const state = settingsStore.getState()
      expect(state.presenceGreetingPhrases.length).toBeGreaterThan(0)
      expect(state.presenceGreetingPhrases[0].text).toBe(
        'いらっしゃいませ！何かお手伝いできることはありますか？'
      )
      expect(state.presenceGreetingPhrases[0].emotion).toBe('happy')
    })

    it('should support multiple phrases', () => {
      const newPhrases = [
        createIdlePhrase('ようこそ！', 'happy', 0),
        createIdlePhrase('いらっしゃいませ！', 'neutral', 1),
        createIdlePhrase('お待ちしておりました！', 'surprised', 2),
      ]
      settingsStore.setState({ presenceGreetingPhrases: newPhrases })
      expect(settingsStore.getState().presenceGreetingPhrases.length).toBe(3)
    })

    it('should allow empty array (no greeting)', () => {
      settingsStore.setState({ presenceGreetingPhrases: [] })
      expect(settingsStore.getState().presenceGreetingPhrases).toEqual([])
    })
  })

  describe('presenceDeparturePhrases', () => {
    it('should default to empty array', () => {
      const state = settingsStore.getState()
      expect(state.presenceDeparturePhrases).toEqual([])
    })

    it('should support multiple phrases', () => {
      const newPhrases = [
        createIdlePhrase('またお越しください！', 'happy', 0),
        createIdlePhrase('ありがとうございました！', 'neutral', 1),
      ]
      settingsStore.setState({ presenceDeparturePhrases: newPhrases })
      expect(settingsStore.getState().presenceDeparturePhrases.length).toBe(2)
    })
  })

  describe('presenceDepartureTimeout', () => {
    it('should default to 10 seconds', () => {
      const state = settingsStore.getState()
      expect(state.presenceDepartureTimeout).toBe(10)
    })

    it('should be updatable within valid range (1-30 seconds)', () => {
      settingsStore.setState({ presenceDepartureTimeout: 1 })
      expect(settingsStore.getState().presenceDepartureTimeout).toBe(1)

      settingsStore.setState({ presenceDepartureTimeout: 30 })
      expect(settingsStore.getState().presenceDepartureTimeout).toBe(30)

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

  describe('presenceClearChatOnDeparture', () => {
    it('should default to true', () => {
      const state = settingsStore.getState()
      expect(state.presenceClearChatOnDeparture).toBe(true)
    })

    it('should be updatable', () => {
      settingsStore.setState({ presenceClearChatOnDeparture: false })
      expect(settingsStore.getState().presenceClearChatOnDeparture).toBe(false)
    })
  })

  describe('persistence', () => {
    it('should include all presence settings in state', () => {
      const customPhrases = [createIdlePhrase('カスタムメッセージ', 'happy', 0)]
      settingsStore.setState({
        presenceDetectionEnabled: true,
        presenceGreetingPhrases: customPhrases,
        presenceDepartureTimeout: 5,
        presenceCooldownTime: 10,
        presenceDetectionSensitivity: 'high',
        presenceDebugMode: true,
        presenceDeparturePhrases: [],
        presenceClearChatOnDeparture: false,
      })

      const state = settingsStore.getState()
      expect(state.presenceDetectionEnabled).toBe(true)
      expect(state.presenceGreetingPhrases[0].text).toBe('カスタムメッセージ')
      expect(state.presenceDepartureTimeout).toBe(5)
      expect(state.presenceCooldownTime).toBe(10)
      expect(state.presenceDetectionSensitivity).toBe('high')
      expect(state.presenceDebugMode).toBe(true)
      expect(state.presenceClearChatOnDeparture).toBe(false)
    })
  })
})
