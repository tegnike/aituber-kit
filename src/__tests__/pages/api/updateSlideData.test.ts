/**
 * @jest-environment node
 */

const mockAccess = jest.fn()
const mockWriteFile = jest.fn()

jest.mock('fs/promises', () => ({
  access: (...args: unknown[]) => mockAccess(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}))

const mockIsDemoMode = jest.fn(() => false)
jest.mock('@/utils/restrictedMode', () => ({
  isRestrictedMode: () => mockIsDemoMode(),
  createRestrictedModeErrorResponse: (feature: string) => ({
    error: 'feature_disabled_in_restricted_mode',
    message: `The feature "${feature}" is disabled in restricted mode.`,
  }),
}))

import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/updateSlideData'

function createMockReq(
  overrides: Partial<NextApiRequest> = {}
): NextApiRequest {
  return {
    method: 'POST',
    body: {},
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

describe('/api/updateSlideData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsDemoMode.mockReturnValue(false)
    mockAccess.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return 405 for non-POST requests', async () => {
    const req = createMockReq({ method: 'GET' })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(405)
    expect(res._json).toEqual({ message: 'Method Not Allowed' })
  })

  it('should return 403 when restricted mode is active', async () => {
    mockIsDemoMode.mockReturnValue(true)

    const req = createMockReq({
      body: {
        slideName: 'test',
        scripts: [{ page: 1, line: 'hello' }],
        supplementContent: 'supplement',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(403)
    expect(res._json).toEqual({
      error: 'feature_disabled_in_restricted_mode',
      message:
        'The feature "update-slide-data" is disabled in restricted mode.',
    })
  })

  it('should return 400 when slideName is missing', async () => {
    const req = createMockReq({
      body: {
        scripts: [{ page: 1, line: 'hello' }],
        supplementContent: 'test',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
  })

  it('should return 400 for path traversal attempts', async () => {
    const req = createMockReq({
      body: {
        slideName: '../../../etc/passwd',
        scripts: [{ page: 1, line: 'hello' }],
        supplementContent: 'test',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect((res._json as any).message).toContain('Invalid slideName')
  })

  it('should return 400 for invalid characters in slideName', async () => {
    const req = createMockReq({
      body: {
        slideName: 'test:slide',
        scripts: [{ page: 1, line: 'hello' }],
        supplementContent: 'test',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
  })

  it('should return 404 when slide directory does not exist', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'))

    const req = createMockReq({
      body: {
        slideName: 'nonexistent',
        scripts: [{ page: 1, line: 'hello' }],
        supplementContent: 'test',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(404)
  })

  it('should return 400 for invalid scripts format', async () => {
    const req = createMockReq({
      body: {
        slideName: 'test-slide',
        scripts: [{ page: 'not-a-number', line: 'hello' }],
        supplementContent: 'test',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect((res._json as any).message).toContain('Invalid scripts format')
  })

  it('should save slide data successfully', async () => {
    const req = createMockReq({
      body: {
        slideName: 'my-slide',
        scripts: [{ page: 1, line: 'hello world' }],
        supplementContent: 'extra info',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(res._json).toEqual({ message: 'Slide data updated successfully' })
    expect(mockWriteFile).toHaveBeenCalledTimes(2) // scripts.json + supplement.txt
  })
})
