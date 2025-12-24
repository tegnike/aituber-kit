import {
  isDemoMode,
  createDemoModeErrorResponse,
  DemoModeErrorResponse,
} from '@/utils/demoMode'

describe('demoMode', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isDemoMode', () => {
    it('should return true when NEXT_PUBLIC_DEMO_MODE is "true"', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'
      expect(isDemoMode()).toBe(true)
    })

    it('should return false when NEXT_PUBLIC_DEMO_MODE is "false"', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'
      expect(isDemoMode()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_DEMO_MODE is undefined', () => {
      delete process.env.NEXT_PUBLIC_DEMO_MODE
      expect(isDemoMode()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_DEMO_MODE is empty string', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = ''
      expect(isDemoMode()).toBe(false)
    })

    it('should return false when NEXT_PUBLIC_DEMO_MODE is "TRUE" (case sensitive)', () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'TRUE'
      expect(isDemoMode()).toBe(false)
    })
  })

  describe('createDemoModeErrorResponse', () => {
    it('should return correct error response structure', () => {
      const response = createDemoModeErrorResponse('upload-image')

      expect(response).toEqual({
        error: 'feature_disabled_in_demo_mode',
        message: expect.any(String),
      })
    })

    it('should include feature name in message', () => {
      const response = createDemoModeErrorResponse('upload-image')

      expect(response.message).toContain('upload-image')
    })

    it('should have correct error type', () => {
      const response = createDemoModeErrorResponse('test-feature')

      expect(response.error).toBe('feature_disabled_in_demo_mode')
    })

    it('should satisfy DemoModeErrorResponse type', () => {
      const response: DemoModeErrorResponse =
        createDemoModeErrorResponse('test')

      expect(response.error).toBe('feature_disabled_in_demo_mode')
      expect(typeof response.message).toBe('string')
    })
  })
})
