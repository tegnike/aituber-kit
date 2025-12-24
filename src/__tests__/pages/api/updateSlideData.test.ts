import { createMocks } from 'node-mocks-http'
import * as demoMode from '@/utils/demoMode'

jest.mock('@/utils/demoMode', () => ({
  isDemoMode: jest.fn(),
  createDemoModeErrorResponse: jest.fn((featureName: string) => ({
    error: 'feature_disabled_in_demo_mode',
    message: `The feature "${featureName}" is disabled in demo mode.`,
  })),
}))

jest.mock('fs/promises', () => ({
  access: jest.fn(),
  writeFile: jest.fn(),
}))

const mockIsDemoMode = demoMode.isDemoMode as jest.MockedFunction<
  typeof demoMode.isDemoMode
>

describe('/api/updateSlideData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsDemoMode.mockReturnValue(false)
  })

  describe('demo mode', () => {
    it('should reject with 403 when demo mode is enabled', async () => {
      mockIsDemoMode.mockReturnValue(true)

      // Import after mock is set up
      const handler = (await import('@/pages/api/updateSlideData')).default

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          slideName: 'test-slide',
          scripts: [{ page: 0, line: 'test' }],
          supplementContent: 'test',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'feature_disabled_in_demo_mode',
        message: expect.stringContaining('updateSlideData'),
      })
    })

    it('should proceed when demo mode is disabled', async () => {
      mockIsDemoMode.mockReturnValue(false)

      const handler = (await import('@/pages/api/updateSlideData')).default

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          slideName: 'test-slide',
          scripts: [{ page: 0, line: 'test' }],
          supplementContent: 'test content',
        },
      })

      await handler(req, res)

      // Should proceed past demo mode check (not 403)
      expect(res._getStatusCode()).not.toBe(403)
    })
  })

  it('should reject non-POST requests', async () => {
    const handler = (await import('@/pages/api/updateSlideData')).default

    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Method Not Allowed',
    })
  })
})
