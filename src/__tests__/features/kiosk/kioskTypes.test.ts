/**
 * Kiosk Types Tests
 *
 * TDD: Tests for kiosk mode type definitions and utility functions
 */

import {
  DEFAULT_KIOSK_CONFIG,
  KIOSK_MAX_INPUT_LENGTH_MIN,
  KIOSK_MAX_INPUT_LENGTH_MAX,
  KIOSK_PASSCODE_MIN_LENGTH,
  clampKioskMaxInputLength,
  isValidPasscode,
  parseNgWords,
} from '@/features/kiosk/kioskTypes'

describe('Kiosk Types', () => {
  describe('DEFAULT_KIOSK_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_KIOSK_CONFIG.kioskModeEnabled).toBe(false)
      expect(DEFAULT_KIOSK_CONFIG.kioskPasscode).toBe('0000')
      expect(DEFAULT_KIOSK_CONFIG.kioskMaxInputLength).toBe(200)
      expect(DEFAULT_KIOSK_CONFIG.kioskNgWords).toEqual([])
      expect(DEFAULT_KIOSK_CONFIG.kioskNgWordEnabled).toBe(false)
      expect(DEFAULT_KIOSK_CONFIG.kioskTemporaryUnlock).toBe(false)
    })
  })

  describe('Validation Constants', () => {
    it('should have correct max input length range', () => {
      expect(KIOSK_MAX_INPUT_LENGTH_MIN).toBe(50)
      expect(KIOSK_MAX_INPUT_LENGTH_MAX).toBe(500)
    })

    it('should have correct passcode min length', () => {
      expect(KIOSK_PASSCODE_MIN_LENGTH).toBe(4)
    })
  })

  describe('clampKioskMaxInputLength', () => {
    it('should clamp values below minimum to minimum', () => {
      expect(clampKioskMaxInputLength(0)).toBe(KIOSK_MAX_INPUT_LENGTH_MIN)
      expect(clampKioskMaxInputLength(49)).toBe(KIOSK_MAX_INPUT_LENGTH_MIN)
    })

    it('should clamp values above maximum to maximum', () => {
      expect(clampKioskMaxInputLength(600)).toBe(KIOSK_MAX_INPUT_LENGTH_MAX)
      expect(clampKioskMaxInputLength(501)).toBe(KIOSK_MAX_INPUT_LENGTH_MAX)
    })

    it('should return value as-is when within range', () => {
      expect(clampKioskMaxInputLength(50)).toBe(50)
      expect(clampKioskMaxInputLength(200)).toBe(200)
      expect(clampKioskMaxInputLength(500)).toBe(500)
    })
  })

  describe('isValidPasscode', () => {
    it('should return true for valid alphanumeric passcodes', () => {
      expect(isValidPasscode('0000')).toBe(true)
      expect(isValidPasscode('1234')).toBe(true)
      expect(isValidPasscode('abcd')).toBe(true)
      expect(isValidPasscode('ABCD')).toBe(true)
      expect(isValidPasscode('Ab12')).toBe(true)
      expect(isValidPasscode('12345678')).toBe(true)
    })

    it('should return false for passcodes shorter than minimum length', () => {
      expect(isValidPasscode('')).toBe(false)
      expect(isValidPasscode('1')).toBe(false)
      expect(isValidPasscode('12')).toBe(false)
      expect(isValidPasscode('123')).toBe(false)
    })

    it('should return false for passcodes with non-alphanumeric characters', () => {
      expect(isValidPasscode('12-4')).toBe(false)
      expect(isValidPasscode('abcd!')).toBe(false)
      expect(isValidPasscode('pass word')).toBe(false)
      expect(isValidPasscode('パスワード')).toBe(false)
    })
  })

  describe('parseNgWords', () => {
    it('should parse comma-separated words', () => {
      expect(parseNgWords('word1,word2,word3')).toEqual([
        'word1',
        'word2',
        'word3',
      ])
    })

    it('should trim whitespace from words', () => {
      expect(parseNgWords(' word1 , word2 , word3 ')).toEqual([
        'word1',
        'word2',
        'word3',
      ])
    })

    it('should filter out empty strings', () => {
      expect(parseNgWords('word1,,word2,')).toEqual(['word1', 'word2'])
      expect(parseNgWords(',,')).toEqual([])
    })

    it('should handle empty input', () => {
      expect(parseNgWords('')).toEqual([])
    })

    it('should handle single word', () => {
      expect(parseNgWords('word')).toEqual(['word'])
    })
  })
})
