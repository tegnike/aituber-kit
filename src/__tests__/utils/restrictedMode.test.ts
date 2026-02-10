import {
  isRestrictedMode,
  createRestrictedModeErrorResponse,
  RestrictedModeErrorResponse,
} from '@/utils/restrictedMode'

describe('restrictedMode', () => {
  const originalValue = process.env.NEXT_PUBLIC_RESTRICTED_MODE

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_RESTRICTED_MODE
    } else {
      process.env.NEXT_PUBLIC_RESTRICTED_MODE = originalValue
    }
  })

  describe('isRestrictedMode', () => {
    it('should return true when NEXT_PUBLIC_RESTRICTED_MODE is "true"', () => {
      process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'true'
      expect(isRestrictedMode()).toBe(true)
    })

    it('should return false when NEXT_PUBLIC_RESTRICTED_MODE is "false"', () => {
      process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'false'
      expect(isRestrictedMode()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_RESTRICTED_MODE is undefined', () => {
      delete process.env.NEXT_PUBLIC_RESTRICTED_MODE
      expect(isRestrictedMode()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_RESTRICTED_MODE is empty string', () => {
      process.env.NEXT_PUBLIC_RESTRICTED_MODE = ''
      expect(isRestrictedMode()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_RESTRICTED_MODE is "TRUE" (case sensitive)', () => {
      process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'TRUE'
      expect(isRestrictedMode()).toBe(false)
    })
  })

  describe('createRestrictedModeErrorResponse', () => {
    it('should return correct error response structure', () => {
      const response = createRestrictedModeErrorResponse('upload-image')

      expect(response).toEqual({
        error: 'feature_disabled_in_restricted_mode',
        message: expect.any(String),
      })
    })

    it('should include feature name in message', () => {
      const response = createRestrictedModeErrorResponse('upload-image')

      expect(response.message).toContain('upload-image')
    })

    it('should have correct error type', () => {
      const response = createRestrictedModeErrorResponse('test-feature')

      expect(response.error).toBe('feature_disabled_in_restricted_mode')
    })

    it('should satisfy RestrictedModeErrorResponse type', () => {
      const response: RestrictedModeErrorResponse =
        createRestrictedModeErrorResponse('test')

      expect(response.error).toBe('feature_disabled_in_restricted_mode')
      expect(typeof response.message).toBe('string')
    })
  })
})
