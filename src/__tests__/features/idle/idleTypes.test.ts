/**
 * Idle Mode Types Tests
 *
 * TDD: RED phase - Tests for idle mode types
 */

import {
  IdlePhrase,
  IdlePlaybackMode,
  IdleModeSettings,
  DEFAULT_IDLE_CONFIG,
  IDLE_PLAYBACK_MODES,
  isIdlePlaybackMode,
  createIdlePhrase,
} from '@/features/idle/idleTypes'

describe('Idle Mode Types', () => {
  describe('IdlePlaybackMode', () => {
    it('should define two valid modes', () => {
      expect(IDLE_PLAYBACK_MODES).toEqual(['sequential', 'random'])
    })

    it('should accept valid modes', () => {
      const modes: IdlePlaybackMode[] = ['sequential', 'random']

      modes.forEach((mode) => {
        expect(isIdlePlaybackMode(mode)).toBe(true)
      })
    })

    it('should reject invalid modes', () => {
      expect(isIdlePlaybackMode('invalid')).toBe(false)
      expect(isIdlePlaybackMode('')).toBe(false)
      expect(isIdlePlaybackMode(null)).toBe(false)
      expect(isIdlePlaybackMode(undefined)).toBe(false)
    })
  })

  describe('IdlePhrase interface', () => {
    it('should create a valid IdlePhrase', () => {
      const phrase: IdlePhrase = {
        id: 'phrase-1',
        text: 'こんにちは！',
        emotion: 'happy',
        order: 0,
      }

      expect(phrase.id).toBe('phrase-1')
      expect(phrase.text).toBe('こんにちは！')
      expect(phrase.emotion).toBe('happy')
      expect(phrase.order).toBe(0)
    })

    it('should create phrase with different emotions', () => {
      const phrases: IdlePhrase[] = [
        { id: '1', text: 'やあ！', emotion: 'happy', order: 0 },
        { id: '2', text: 'こんにちは', emotion: 'neutral', order: 1 },
        { id: '3', text: 'よろしくね', emotion: 'relaxed', order: 2 },
      ]

      expect(phrases).toHaveLength(3)
      phrases.forEach((phrase) => {
        expect(typeof phrase.id).toBe('string')
        expect(typeof phrase.text).toBe('string')
        expect(typeof phrase.emotion).toBe('string')
        expect(typeof phrase.order).toBe('number')
      })
    })
  })

  describe('createIdlePhrase', () => {
    it('should create a phrase with auto-generated id', () => {
      const phrase = createIdlePhrase('テストメッセージ', 'neutral', 0)

      expect(phrase.id).toBeDefined()
      expect(phrase.id.length).toBeGreaterThan(0)
      expect(phrase.text).toBe('テストメッセージ')
      expect(phrase.emotion).toBe('neutral')
      expect(phrase.order).toBe(0)
    })

    it('should generate unique ids for each phrase', () => {
      const phrase1 = createIdlePhrase('メッセージ1', 'happy', 0)
      const phrase2 = createIdlePhrase('メッセージ2', 'neutral', 1)

      expect(phrase1.id).not.toBe(phrase2.id)
    })
  })

  describe('IdleModeSettings interface', () => {
    it('should create valid settings', () => {
      const settings: IdleModeSettings = {
        idleModeEnabled: true,
        idlePhrases: [],
        idlePlaybackMode: 'sequential',
        idleInterval: 30,
        idleDefaultEmotion: 'neutral',
        idleTimePeriodEnabled: false,
        idleTimePeriodMorning: 'おはようございます！',
        idleTimePeriodAfternoon: 'こんにちは！',
        idleTimePeriodEvening: 'こんばんは！',
        idleAiGenerationEnabled: false,
        idleAiPromptTemplate:
          '展示会の来場者に向けて、親しみやすい一言を生成してください。',
      }

      expect(settings.idleModeEnabled).toBe(true)
      expect(settings.idlePhrases).toEqual([])
      expect(settings.idlePlaybackMode).toBe('sequential')
      expect(settings.idleInterval).toBe(30)
      expect(settings.idleDefaultEmotion).toBe('neutral')
    })
  })

  describe('DEFAULT_IDLE_CONFIG', () => {
    it('should have idleModeEnabled set to false', () => {
      expect(DEFAULT_IDLE_CONFIG.idleModeEnabled).toBe(false)
    })

    it('should have empty phrases array', () => {
      expect(DEFAULT_IDLE_CONFIG.idlePhrases).toEqual([])
    })

    it('should have sequential playback mode', () => {
      expect(DEFAULT_IDLE_CONFIG.idlePlaybackMode).toBe('sequential')
    })

    it('should have 30 seconds interval', () => {
      expect(DEFAULT_IDLE_CONFIG.idleInterval).toBe(30)
    })

    it('should have neutral as default emotion', () => {
      expect(DEFAULT_IDLE_CONFIG.idleDefaultEmotion).toBe('neutral')
    })

    it('should have time period settings disabled by default', () => {
      expect(DEFAULT_IDLE_CONFIG.idleTimePeriodEnabled).toBe(false)
      expect(DEFAULT_IDLE_CONFIG.idleTimePeriodMorning).toBe(
        'おはようございます！'
      )
      expect(DEFAULT_IDLE_CONFIG.idleTimePeriodAfternoon).toBe('こんにちは！')
      expect(DEFAULT_IDLE_CONFIG.idleTimePeriodEvening).toBe('こんばんは！')
    })

    it('should have AI generation disabled by default', () => {
      expect(DEFAULT_IDLE_CONFIG.idleAiGenerationEnabled).toBe(false)
      expect(DEFAULT_IDLE_CONFIG.idleAiPromptTemplate).toBe('')
    })
  })
})
