/**
 * @jest-environment node
 */

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  readFileSync: jest.fn(() => '[]'),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => null),
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
import handler from '@/pages/api/save-chat-log'

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

describe('/api/save-chat-log', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsDemoMode.mockReturnValue(false)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return 405 for non-POST requests', async () => {
    const req = createMockReq({ method: 'GET' })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(405)
    expect(res._json).toEqual({ message: 'Method not allowed' })
  })

  it('should return 403 when restricted mode is active', async () => {
    mockIsDemoMode.mockReturnValue(true)

    const req = createMockReq({
      body: {
        messages: [{ role: 'user', content: 'Hello' }],
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(403)
    expect(res._json).toEqual({
      error: 'feature_disabled_in_restricted_mode',
      message: 'The feature "save-chat-log" is disabled in restricted mode.',
    })
  })

  it('should return 400 for invalid messages data', async () => {
    const req = createMockReq({
      body: { messages: [] },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({ message: 'Invalid messages data' })
  })

  it('should return 400 for non-array messages', async () => {
    const req = createMockReq({
      body: { messages: 'not-an-array' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
  })

  it('should save messages successfully', async () => {
    const fs = require('fs')

    const req = createMockReq({
      body: {
        messages: [{ role: 'user', content: 'Hello' }],
        isNewFile: true,
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(res._json).toEqual({ message: 'Logs saved successfully' })
    expect(fs.writeFileSync).toHaveBeenCalled()
  })

  it('should return 400 when overwrite=true but targetFileName is missing', async () => {
    const req = createMockReq({
      body: {
        messages: [{ role: 'user', content: 'Hello' }],
        overwrite: true,
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
  })
})
