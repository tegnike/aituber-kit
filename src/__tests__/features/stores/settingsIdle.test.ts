/**
 * Settings Store - Idle Mode Settings Tests
 *
 * TDD: Tests for idle mode configuration in settings store
 */

import settingsStore from '@/features/stores/settings'
import { DEFAULT_IDLE_CONFIG } from '@/features/idle/idleTypes'

describe('Settings Store - Idle Mode Settings', () => {
  beforeEach(() => {
    // Reset store to default values
    settingsStore.setState({
      idleModeEnabled: DEFAULT_IDLE_CONFIG.idleModeEnabled,
      idlePhrases: DEFAULT_IDLE_CONFIG.idlePhrases,
      idlePlaybackMode: DEFAULT_IDLE_CONFIG.idlePlaybackMode,
      idleInterval: DEFAULT_IDLE_CONFIG.idleInterval,
      idleDefaultEmotion: DEFAULT_IDLE_CONFIG.idleDefaultEmotion,
      idleTimePeriodEnabled: DEFAULT_IDLE_CONFIG.idleTimePeriodEnabled,
      idleTimePeriodMorning: DEFAULT_IDLE_CONFIG.idleTimePeriodMorning,
      idleTimePeriodAfternoon: DEFAULT_IDLE_CONFIG.idleTimePeriodAfternoon,
      idleTimePeriodEvening: DEFAULT_IDLE_CONFIG.idleTimePeriodEvening,
      idleAiGenerationEnabled: DEFAULT_IDLE_CONFIG.idleAiGenerationEnabled,
      idleAiPromptTemplate: DEFAULT_IDLE_CONFIG.idleAiPromptTemplate,
    })
  })

  describe('idleModeEnabled', () => {
    it('should default to false', () => {
      const state = settingsStore.getState()
      expect(state.idleModeEnabled).toBe(false)
    })

    it('should be updatable', () => {
      settingsStore.setState({ idleModeEnabled: true })
      expect(settingsStore.getState().idleModeEnabled).toBe(true)

      settingsStore.setState({ idleModeEnabled: false })
      expect(settingsStore.getState().idleModeEnabled).toBe(false)
    })
  })

  describe('idlePhrases', () => {
    it('should default to empty array', () => {
      const state = settingsStore.getState()
      expect(state.idlePhrases).toEqual([])
    })

    it('should be updatable with phrases', () => {
      const phrases = [
        { id: '1', text: 'こんにちは！', emotion: 'happy', order: 0 },
        { id: '2', text: 'いらっしゃいませ！', emotion: 'neutral', order: 1 },
      ]
      settingsStore.setState({ idlePhrases: phrases })
      expect(settingsStore.getState().idlePhrases).toEqual(phrases)
    })
  })

  describe('idlePlaybackMode', () => {
    it('should default to sequential', () => {
      const state = settingsStore.getState()
      expect(state.idlePlaybackMode).toBe('sequential')
    })

    it('should be updatable to random', () => {
      settingsStore.setState({ idlePlaybackMode: 'random' })
      expect(settingsStore.getState().idlePlaybackMode).toBe('random')
    })
  })

  describe('idleInterval', () => {
    it('should default to 30', () => {
      const state = settingsStore.getState()
      expect(state.idleInterval).toBe(30)
    })

    it('should be updatable within valid range (10-300)', () => {
      settingsStore.setState({ idleInterval: 10 })
      expect(settingsStore.getState().idleInterval).toBe(10)

      settingsStore.setState({ idleInterval: 300 })
      expect(settingsStore.getState().idleInterval).toBe(300)

      settingsStore.setState({ idleInterval: 60 })
      expect(settingsStore.getState().idleInterval).toBe(60)
    })
  })

  describe('idleDefaultEmotion', () => {
    it('should default to neutral', () => {
      const state = settingsStore.getState()
      expect(state.idleDefaultEmotion).toBe('neutral')
    })

    it('should be updatable', () => {
      settingsStore.setState({ idleDefaultEmotion: 'happy' })
      expect(settingsStore.getState().idleDefaultEmotion).toBe('happy')
    })
  })

  describe('Time Period Settings', () => {
    it('should default to disabled', () => {
      const state = settingsStore.getState()
      expect(state.idleTimePeriodEnabled).toBe(false)
    })

    it('should have default greeting messages', () => {
      const state = settingsStore.getState()
      expect(state.idleTimePeriodMorning).toBe('おはようございます！')
      expect(state.idleTimePeriodAfternoon).toBe('こんにちは！')
      expect(state.idleTimePeriodEvening).toBe('こんばんは！')
    })

    it('should be updatable', () => {
      settingsStore.setState({
        idleTimePeriodEnabled: true,
        idleTimePeriodMorning: 'おはよう！',
        idleTimePeriodAfternoon: 'やあ！',
        idleTimePeriodEvening: 'こんばんは〜',
      })

      const state = settingsStore.getState()
      expect(state.idleTimePeriodEnabled).toBe(true)
      expect(state.idleTimePeriodMorning).toBe('おはよう！')
      expect(state.idleTimePeriodAfternoon).toBe('やあ！')
      expect(state.idleTimePeriodEvening).toBe('こんばんは〜')
    })
  })

  describe('AI Generation Settings', () => {
    it('should default to disabled', () => {
      const state = settingsStore.getState()
      expect(state.idleAiGenerationEnabled).toBe(false)
    })

    it('should have default prompt template', () => {
      const state = settingsStore.getState()
      expect(state.idleAiPromptTemplate).toBe('')
    })

    it('should be updatable', () => {
      settingsStore.setState({
        idleAiGenerationEnabled: true,
        idleAiPromptTemplate: 'カスタムプロンプト',
      })

      const state = settingsStore.getState()
      expect(state.idleAiGenerationEnabled).toBe(true)
      expect(state.idleAiPromptTemplate).toBe('カスタムプロンプト')
    })
  })

  describe('persistence', () => {
    it('should include idle mode settings in state', () => {
      settingsStore.setState({
        idleModeEnabled: true,
        idlePhrases: [{ id: '1', text: 'テスト', emotion: 'happy', order: 0 }],
        idlePlaybackMode: 'random',
        idleInterval: 60,
        idleDefaultEmotion: 'happy',
        idleTimePeriodEnabled: true,
        idleTimePeriodMorning: 'おはよう',
        idleTimePeriodAfternoon: 'こんにちは',
        idleTimePeriodEvening: 'こんばんは',
        idleAiGenerationEnabled: true,
        idleAiPromptTemplate: 'テストプロンプト',
      })

      const state = settingsStore.getState()
      expect(state.idleModeEnabled).toBe(true)
      expect(state.idlePhrases).toHaveLength(1)
      expect(state.idlePlaybackMode).toBe('random')
      expect(state.idleInterval).toBe(60)
      expect(state.idleDefaultEmotion).toBe('happy')
      expect(state.idleTimePeriodEnabled).toBe(true)
      expect(state.idleAiGenerationEnabled).toBe(true)
    })
  })
})
