/**
 * Presence Detection Types Tests
 *
 * TDD: RED phase - Tests for presence detection types
 */

import {
  PresenceState,
  PresenceError,
  PresenceErrorCode,
  DetectionResult,
  BoundingBox,
  PRESENCE_STATES,
  PRESENCE_ERROR_CODES,
  isPresenceState,
  isPresenceErrorCode,
} from '@/features/presence/presenceTypes'

describe('Presence Detection Types', () => {
  describe('PresenceState', () => {
    it('should define four valid states', () => {
      expect(PRESENCE_STATES).toEqual([
        'idle',
        'detected',
        'greeting',
        'conversation-ready',
      ])
    })

    it('should accept valid states', () => {
      const states: PresenceState[] = [
        'idle',
        'detected',
        'greeting',
        'conversation-ready',
      ]

      states.forEach((state) => {
        expect(isPresenceState(state)).toBe(true)
      })
    })

    it('should reject invalid states', () => {
      expect(isPresenceState('invalid')).toBe(false)
      expect(isPresenceState('')).toBe(false)
      expect(isPresenceState(null)).toBe(false)
      expect(isPresenceState(undefined)).toBe(false)
    })
  })

  describe('PresenceErrorCode', () => {
    it('should define three error codes', () => {
      expect(PRESENCE_ERROR_CODES).toEqual([
        'CAMERA_PERMISSION_DENIED',
        'CAMERA_NOT_AVAILABLE',
        'MODEL_LOAD_FAILED',
      ])
    })

    it('should accept valid error codes', () => {
      const codes: PresenceErrorCode[] = [
        'CAMERA_PERMISSION_DENIED',
        'CAMERA_NOT_AVAILABLE',
        'MODEL_LOAD_FAILED',
      ]

      codes.forEach((code) => {
        expect(isPresenceErrorCode(code)).toBe(true)
      })
    })

    it('should reject invalid error codes', () => {
      expect(isPresenceErrorCode('UNKNOWN_ERROR')).toBe(false)
      expect(isPresenceErrorCode('')).toBe(false)
    })
  })

  describe('PresenceError interface', () => {
    it('should create a valid PresenceError', () => {
      const error: PresenceError = {
        code: 'CAMERA_PERMISSION_DENIED',
        message: 'カメラへのアクセスが拒否されました',
      }

      expect(error.code).toBe('CAMERA_PERMISSION_DENIED')
      expect(error.message).toBe('カメラへのアクセスが拒否されました')
    })

    it('should create error for each code type', () => {
      const errors: PresenceError[] = [
        {
          code: 'CAMERA_PERMISSION_DENIED',
          message: 'カメラへのアクセス許可が必要です',
        },
        {
          code: 'CAMERA_NOT_AVAILABLE',
          message: 'カメラが利用できません',
        },
        {
          code: 'MODEL_LOAD_FAILED',
          message: '顔検出モデルの読み込みに失敗しました',
        },
      ]

      expect(errors).toHaveLength(3)
      errors.forEach((error) => {
        expect(typeof error.code).toBe('string')
        expect(typeof error.message).toBe('string')
      })
    })
  })

  describe('BoundingBox interface', () => {
    it('should create a valid BoundingBox', () => {
      const box: BoundingBox = {
        x: 100,
        y: 50,
        width: 200,
        height: 250,
      }

      expect(box.x).toBe(100)
      expect(box.y).toBe(50)
      expect(box.width).toBe(200)
      expect(box.height).toBe(250)
    })

    it('should allow floating point values', () => {
      const box: BoundingBox = {
        x: 100.5,
        y: 50.25,
        width: 200.75,
        height: 250.125,
      }

      expect(box.x).toBeCloseTo(100.5)
      expect(box.y).toBeCloseTo(50.25)
      expect(box.width).toBeCloseTo(200.75)
      expect(box.height).toBeCloseTo(250.125)
    })
  })

  describe('DetectionResult interface', () => {
    it('should create a detection result with face detected', () => {
      const result: DetectionResult = {
        faceDetected: true,
        confidence: 0.95,
        boundingBox: {
          x: 100,
          y: 50,
          width: 200,
          height: 250,
        },
      }

      expect(result.faceDetected).toBe(true)
      expect(result.confidence).toBe(0.95)
      expect(result.boundingBox).toBeDefined()
      expect(result.boundingBox?.x).toBe(100)
    })

    it('should create a detection result without face detected', () => {
      const result: DetectionResult = {
        faceDetected: false,
        confidence: 0,
      }

      expect(result.faceDetected).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.boundingBox).toBeUndefined()
    })

    it('should have confidence between 0 and 1', () => {
      const result: DetectionResult = {
        faceDetected: true,
        confidence: 0.85,
      }

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })
})
