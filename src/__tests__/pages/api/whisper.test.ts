/**
 * @jest-environment node
 */

const mockCreateTranscription = jest.fn()

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    audio: {
      transcriptions: {
        create: mockCreateTranscription,
      },
    },
  })),
}))

import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/whisper'

function createMockReq(
  overrides: Partial<NextApiRequest> = {}
): NextApiRequest {
  return {
    method: 'POST',
    headers: {},
    on: jest.fn(),
    destroy: jest.fn(),
    ...overrides,
  } as unknown as NextApiRequest
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

function createMultipartReq(fields: Record<string, string>): NextApiRequest {
  const boundary = 'test-boundary'
  const chunks = Object.entries(fields).map(
    ([name, value]) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
  )
  chunks.unshift(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\ntest audio\r\n`
  )
  chunks.push(`--${boundary}--\r\n`)
  const body = Buffer.from(chunks.join(''))
  const listeners: Record<string, (...args: unknown[]) => void> = {}

  const req = createMockReq({
    headers: {
      'content-length': String(body.length),
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
  })
  req.on = jest.fn((event: string, listener: (...args: unknown[]) => void) => {
    listeners[event] = listener
    if (event === 'end') {
      queueMicrotask(() => {
        listeners.data?.(body)
        listeners.end?.()
      })
    }
    return req
  }) as NextApiRequest['on']

  return req
}

describe('/api/whisper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateTranscription.mockResolvedValue({ text: 'transcribed text' })
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('rejects request bodies larger than the Whisper upload limit before buffering', async () => {
    const req = createMockReq({
      headers: {
        'content-length': String(26 * 1024 * 1024),
        'content-type': 'multipart/form-data; boundary=test-boundary',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(413)
    expect(res._json).toEqual(
      expect.objectContaining({
        error: 'Request body is too large',
      })
    )
    expect(req.on).not.toHaveBeenCalled()
  })

  it('uses gpt-transcribe by default without legacy-only request fields', async () => {
    const req = createMultipartReq({ openaiKey: 'client-key' })
    const res = createMockRes()

    await handler(req, res)

    expect(mockCreateTranscription).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-transcribe',
      })
    )
    const request = mockCreateTranscription.mock.calls[0][0]
    expect(request).not.toHaveProperty('language')
    expect(request).not.toHaveProperty('response_format')
    expect(res._status).toBe(200)
    expect(res._json).toEqual({ text: 'transcribed text' })
  })

  it('rejects the transcription snapshot scheduled for removal', async () => {
    const req = createMultipartReq({
      openaiKey: 'client-key',
      model: 'gpt-4o-mini-transcribe-2025-03-20',
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({ error: 'Unsupported transcription model' })
    expect(mockCreateTranscription).not.toHaveBeenCalled()
  })
})
