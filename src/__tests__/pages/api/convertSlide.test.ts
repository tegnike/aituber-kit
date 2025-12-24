import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/convertSlide'
import * as demoMode from '@/utils/demoMode'

jest.mock('@/utils/demoMode', () => ({
  isDemoMode: jest.fn(),
  createDemoModeErrorResponse: jest.fn((featureName: string) => ({
    error: 'feature_disabled_in_demo_mode',
    message: `The feature "${featureName}" is disabled in demo mode.`,
  })),
}))

jest.mock('formidable', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      parse: jest.fn(),
    })),
  }
})

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn(),
}))

jest.mock('canvas', () => ({
  createCanvas: jest.fn(),
}))

const mockIsDemoMode = demoMode.isDemoMode as jest.MockedFunction<
  typeof demoMode.isDemoMode
>

describe('/api/convertSlide', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsDemoMode.mockReturnValue(false)
  })

  describe('demo mode', () => {
    it('should reject with 403 when demo mode is enabled', async () => {
      mockIsDemoMode.mockReturnValue(true)

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'feature_disabled_in_demo_mode',
        message: expect.stringContaining('convertSlide'),
      })
    })

    it('should allow conversion when demo mode is disabled', async () => {
      mockIsDemoMode.mockReturnValue(false)

      const formidable = require('formidable')
      const mockForm = {
        parse: jest.fn((req, callback) => {
          callback(null, {}, {})
        }),
      }
      formidable.default.mockReturnValue(mockForm)

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      // Demo mode disabled, so it should proceed (and fail due to no file)
      expect(res._getStatusCode()).toBe(400)
      expect(res._getData()).toBe('No file uploaded')
    })
  })
})
