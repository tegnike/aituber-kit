import {
  isLive2DEnabled,
  createLive2DRestrictionErrorResponse,
  Live2DRestrictionErrorResponse,
} from '@/utils/live2dRestriction'

describe('live2dRestriction', () => {
  const originalValue = process.env.NEXT_PUBLIC_LIVE2D_ENABLED

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_LIVE2D_ENABLED
    } else {
      process.env.NEXT_PUBLIC_LIVE2D_ENABLED = originalValue
    }
  })

  describe('isLive2DEnabled', () => {
    it('should return true when NEXT_PUBLIC_LIVE2D_ENABLED is "true"', () => {
      process.env.NEXT_PUBLIC_LIVE2D_ENABLED = 'true'
      expect(isLive2DEnabled()).toBe(true)
    })

    it('should return false when NEXT_PUBLIC_LIVE2D_ENABLED is "false"', () => {
      process.env.NEXT_PUBLIC_LIVE2D_ENABLED = 'false'
      expect(isLive2DEnabled()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_LIVE2D_ENABLED is undefined', () => {
      delete process.env.NEXT_PUBLIC_LIVE2D_ENABLED
      expect(isLive2DEnabled()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_LIVE2D_ENABLED is empty string', () => {
      process.env.NEXT_PUBLIC_LIVE2D_ENABLED = ''
      expect(isLive2DEnabled()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_LIVE2D_ENABLED is "TRUE" (case sensitive)', () => {
      process.env.NEXT_PUBLIC_LIVE2D_ENABLED = 'TRUE'
      expect(isLive2DEnabled()).toBe(false)
    })
  })

  describe('createLive2DRestrictionErrorResponse', () => {
    it('should return correct error response structure', () => {
      const response = createLive2DRestrictionErrorResponse()

      expect(response).toEqual({
        error: 'live2d_feature_disabled',
        message: expect.any(String),
      })
    })

    it('should include license requirement in message', () => {
      const response = createLive2DRestrictionErrorResponse()

      expect(response.message).toContain('Live2D')
      expect(response.message).toContain('NEXT_PUBLIC_LIVE2D_ENABLED')
    })

    it('should have correct error type', () => {
      const response = createLive2DRestrictionErrorResponse()

      expect(response.error).toBe('live2d_feature_disabled')
    })

    it('should satisfy Live2DRestrictionErrorResponse type', () => {
      const response: Live2DRestrictionErrorResponse =
        createLive2DRestrictionErrorResponse()

      expect(response.error).toBe('live2d_feature_disabled')
      expect(typeof response.message).toBe('string')
    })
  })
})
