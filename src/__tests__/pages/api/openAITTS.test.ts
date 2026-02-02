/**
 * @jest-environment node
 */

const mockSpeechCreate = jest.fn()
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    audio: {
      speech: {
        create: mockSpeechCreate,
      },
    },
  }))
})

import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/openAITTS'

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
    _body: null as unknown,
    _headers: {} as Record<string, string>,
    status(code: number) {
      res._status = code
      return res
    },
    json(data: unknown) {
      res._json = data
      return res
    },
    send(data: unknown) {
      res._body = data
      return res
    },
    setHeader(key: string, value: string) {
      res._headers[key] = value
      return res
    },
  }
  return res as unknown as NextApiResponse & {
    _status: number
    _json: unknown
    _body: unknown
    _headers: Record<string, string>
  }
}

describe('/api/openAITTS', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 405 for non-POST methods', async () => {
    const req = createMockReq({ method: 'GET' })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(405)
    expect(res._json).toEqual({ error: 'Method not allowed' })
  })

  it('should return 400 when message is missing', async () => {
    const req = createMockReq({
      body: { voice: 'alloy', model: 'tts-1', apiKey: 'key' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({ error: 'Missing required parameters' })
  })

  it('should return 400 when voice is missing', async () => {
    const req = createMockReq({
      body: { message: 'hello', model: 'tts-1', apiKey: 'key' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
  })

  it('should return 400 when model is missing', async () => {
    const req = createMockReq({
      body: { message: 'hello', voice: 'alloy', apiKey: 'key' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
  })

  it('should return 400 when apiKey is missing and no env vars set', async () => {
    const originalTtsKey = process.env.OPENAI_TTS_KEY
    const originalApiKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_TTS_KEY
    delete process.env.OPENAI_API_KEY

    const req = createMockReq({
      body: { message: 'hello', voice: 'alloy', model: 'tts-1' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)

    process.env.OPENAI_TTS_KEY = originalTtsKey
    process.env.OPENAI_API_KEY = originalApiKey
  })

  it('should return audio buffer on success', async () => {
    const fakeBuffer = Buffer.from('fake-audio')
    mockSpeechCreate.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(fakeBuffer),
    })

    const req = createMockReq({
      body: {
        message: 'hello',
        voice: 'alloy',
        model: 'tts-1',
        speed: 1.0,
        apiKey: 'test-key',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._headers['Content-Type']).toBe('audio/mpeg')
    expect(res._body).toBeTruthy()
  })

  it('should add emotional instructions for gpt-4o model', async () => {
    const fakeBuffer = Buffer.from('audio')
    mockSpeechCreate.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(fakeBuffer),
    })

    const req = createMockReq({
      body: {
        message: 'I am happy',
        voice: 'alloy',
        model: 'gpt-4o-audio',
        speed: 1.0,
        apiKey: 'key',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    const callArgs = mockSpeechCreate.mock.calls[0][0]
    expect(callArgs.instructions).toContain('rich emotional expression')
  })

  it('should not add instructions for non-gpt-4o models', async () => {
    const fakeBuffer = Buffer.from('audio')
    mockSpeechCreate.mockResolvedValue({
      arrayBuffer: () => Promise.resolve(fakeBuffer),
    })

    const req = createMockReq({
      body: {
        message: 'hello',
        voice: 'alloy',
        model: 'tts-1',
        speed: 1.0,
        apiKey: 'key',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    const callArgs = mockSpeechCreate.mock.calls[0][0]
    expect(callArgs.instructions).toBeUndefined()
  })

  it('should return 500 on OpenAI API error', async () => {
    mockSpeechCreate.mockRejectedValue(new Error('API error'))
    jest.spyOn(console, 'error').mockImplementation(() => {})

    const req = createMockReq({
      body: {
        message: 'hello',
        voice: 'alloy',
        model: 'tts-1',
        speed: 1.0,
        apiKey: 'key',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'Failed to generate speech' })
  })
})
