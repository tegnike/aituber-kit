/**
 * @jest-environment node
 */

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  promises: {
    copyFile: jest.fn(),
  },
}))

jest.mock('formidable', () => {
  return jest.fn(() => ({
    parse: jest.fn(),
  }))
})

const mockIsDemoMode = jest.fn(() => false)
jest.mock('@/utils/restrictedMode', () => ({
  isRestrictedMode: () => mockIsDemoMode(),
  createRestrictedModeErrorResponse: (feature: string) => ({
    error: 'feature_disabled_in_restricted_mode',
    message: `The feature "${feature}" is disabled in restricted mode.`,
  }),
}))

import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/upload-background'

function createMockReq(
  overrides: Partial<NextApiRequest> = {}
): NextApiRequest {
  return {
    method: 'POST',
    body: {},
    headers: {},
    ...overrides,
  } as NextApiRequest
}

function createMockRes() {
  const res = {
    _status: 200,
    _json: null as unknown,
    status(code: number) {
      res._status = code
      return res
    },
    json(data: unknown) {
      res._json = data
      return res
    },
  }
  return res as unknown as NextApiResponse & {
    _status: number
    _json: unknown
  }
}

describe('/api/upload-background', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsDemoMode.mockReturnValue(false)
  })

  it('should return 405 for non-POST requests', async () => {
    const req = createMockReq({ method: 'GET' })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(405)
    expect(res._json).toEqual({ error: 'Method not allowed' })
  })

  it('should return 403 when restricted mode is active', async () => {
    mockIsDemoMode.mockReturnValue(true)

    const req = createMockReq()
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(403)
    expect(res._json).toEqual({
      error: 'feature_disabled_in_restricted_mode',
      message:
        'The feature "upload-background" is disabled in restricted mode.',
    })
  })

  it('should return 400 when no file is uploaded', async () => {
    const formidable = require('formidable')
    formidable.mockImplementation(() => ({
      parse: jest.fn().mockResolvedValue([{}, {}]),
    }))

    const req = createMockReq()
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({ error: 'No file uploaded' })
  })

  it('should return 400 for invalid file type', async () => {
    const formidable = require('formidable')
    formidable.mockImplementation(() => ({
      parse: jest.fn().mockResolvedValue([
        {},
        {
          file: [
            {
              originalFilename: 'malware.exe',
              filepath: '/tmp/upload-123',
            },
          ],
        },
      ]),
    }))

    const req = createMockReq()
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect((res._json as any).error).toBe('Invalid file type')
  })

  it('should upload valid image file successfully', async () => {
    const formidable = require('formidable')
    formidable.mockImplementation(() => ({
      parse: jest.fn().mockResolvedValue([
        {},
        {
          file: [
            {
              originalFilename: 'background.png',
              filepath: '/tmp/upload-123',
            },
          ],
        },
      ]),
    }))

    const req = createMockReq()
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(200)
    expect((res._json as any).path).toBe('/backgrounds/background.png')
  })
})
