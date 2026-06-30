/**
 * @jest-environment node
 */

const mockAxiosPost = jest.fn()
jest.mock('axios', () => ({
  post: (...args: unknown[]) => mockAxiosPost(...args),
}))

import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/tts-aivisspeech'

const originalEnv = { ...process.env }

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
    _headers: {} as Record<string, string>,
    status(code: number) {
      res._status = code
      return res
    },
    json(data: unknown) {
      res._json = data
      return res
    },
    setHeader(key: string, value: string) {
      res._headers[key] = value
      return res
    },
    end: jest.fn(),
  }
  return res as unknown as NextApiResponse & {
    _status: number
    _json: unknown
    _headers: Record<string, string>
  }
}

describe('/api/tts-aivisspeech', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.AIVIS_SPEECH_SERVER_URL
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
  })

  it('should call audio_query and synthesis endpoints', async () => {
    const mockPipe = jest.fn()
    mockAxiosPost
      .mockResolvedValueOnce({
        data: { speedScale: 1, pitchScale: 0, intonationScale: 1 },
      })
      .mockResolvedValueOnce({
        data: { pipe: mockPipe },
      })

    const req = createMockReq({
      body: {
        text: 'こんにちは',
        speaker: 1,
        speed: 1.2,
        pitch: 0.1,
        intonationScale: 1.5,
      },
    })
    const res = createMockRes()

    await handler(req, res)

    // First call: audio_query
    expect(mockAxiosPost.mock.calls[0][0]).toContain('/audio_query')
    expect(mockAxiosPost.mock.calls[0][0]).toContain('speaker=1')

    // Second call: synthesis with modified query data
    expect(mockAxiosPost.mock.calls[1][0]).toContain('/synthesis')
    const queryData = mockAxiosPost.mock.calls[1][1]
    expect(queryData.speedScale).toBe(1.2)
    expect(queryData.pitchScale).toBe(0.1)
    expect(queryData.intonationScale).toBe(1.5)
  })

  it('should set Content-Type to audio/wav', async () => {
    const mockPipe = jest.fn()
    mockAxiosPost
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { pipe: mockPipe } })

    const req = createMockReq({
      body: {
        text: 'test',
        speaker: 1,
        speed: 1,
        pitch: 0,
        intonationScale: 1,
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._headers['Content-Type']).toBe('audio/wav')
  })

  it('should use custom serverUrl when provided', async () => {
    const mockPipe = jest.fn()
    mockAxiosPost
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { pipe: mockPipe } })

    const req = createMockReq({
      body: {
        text: 'test',
        speaker: 1,
        speed: 1,
        pitch: 0,
        intonationScale: 1,
        serverUrl: 'http://custom:10101',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(mockAxiosPost.mock.calls[0][0]).toContain('http://custom:10101')
  })

  it('should reject server-configured AivisSpeech URL by default', async () => {
    process.env.AIVIS_SPEECH_SERVER_URL = 'http://aivis.internal:10101'
    delete process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE

    const req = createMockReq({
      body: {
        text: 'test',
        speaker: 1,
        speed: 1,
        pitch: 0,
        intonationScale: 1,
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(403)
    expect(res._json).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'tts-aivisspeech',
      })
    )
    expect(mockAxiosPost).not.toHaveBeenCalled()
  })

  it('should reject invalid serverUrl protocols', async () => {
    const req = createMockReq({
      body: {
        text: 'test',
        speaker: 1,
        speed: 1,
        pitch: 0,
        intonationScale: 1,
        serverUrl: 'file:///tmp/aivis',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({ error: 'Invalid server URL protocol' })
    expect(mockAxiosPost).not.toHaveBeenCalled()
  })

  it('should apply tempoDynamics parameter', async () => {
    const mockPipe = jest.fn()
    mockAxiosPost
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { pipe: mockPipe } })

    const req = createMockReq({
      body: {
        text: 'test',
        speaker: 1,
        speed: 1,
        pitch: 0,
        intonationScale: 1,
        tempoDynamics: 1.5,
      },
    })
    const res = createMockRes()

    await handler(req, res)

    const queryData = mockAxiosPost.mock.calls[1][1]
    expect(queryData.tempoDynamicsScale).toBe(1.5)
  })

  it('should return 500 on error', async () => {
    mockAxiosPost.mockRejectedValue(new Error('Connection refused'))

    const req = createMockReq({
      body: {
        text: 'test',
        speaker: 1,
        speed: 1,
        pitch: 0,
        intonationScale: 1,
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'Internal Server Error' })
  })
})
