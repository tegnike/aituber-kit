/**
 * @jest-environment node
 */

const mockSynthesizeSpeech = jest.fn()
jest.mock('@google-cloud/text-to-speech', () => ({
  TextToSpeechClient: jest.fn().mockImplementation(() => ({
    synthesizeSpeech: mockSynthesizeSpeech,
  })),
}))
jest.mock('@google-cloud/text-to-speech/build/protos/protos', () => ({
  google: { cloud: { texttospeech: { v1: {} } } },
}))

import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/tts-google'

const mockFetch = jest.fn()
global.fetch = mockFetch

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

describe('/api/tts-google', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    delete process.env.GOOGLE_TTS_KEY
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  describe('API Key authentication', () => {
    it('should use API key when GOOGLE_TTS_KEY is set', async () => {
      process.env.GOOGLE_TTS_KEY = 'test-api-key'

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ audioContent: 'base64audio' }),
      })

      const req = createMockReq({
        body: {
          message: 'Hello',
          ttsType: 'en-US-Neural2-F',
          languageCode: 'en-US',
        },
      })
      const res = createMockRes()

      await handler(req, res)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('key=test-api-key'),
        expect.objectContaining({ method: 'POST' })
      )
      expect(res._status).toBe(200)
      expect(res._json).toEqual({ audio: 'base64audio' })
    })

    it('should return 500 on API key fetch failure', async () => {
      process.env.GOOGLE_TTS_KEY = 'test-key'
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      })

      const req = createMockReq({
        body: { message: 'test', ttsType: 'en', languageCode: 'en-US' },
      })
      const res = createMockRes()

      await handler(req, res)

      expect(res._status).toBe(500)
    })
  })

  describe('Credential authentication', () => {
    it('should use TextToSpeechClient when no API key', async () => {
      const audioContent = Buffer.from('audio data')
      mockSynthesizeSpeech.mockResolvedValue([{ audioContent: audioContent }])

      const req = createMockReq({
        body: {
          message: 'Hello',
          ttsType: 'en-US-Neural2-F',
          languageCode: 'en-US',
        },
      })
      const res = createMockRes()

      await handler(req, res)

      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { text: 'Hello' },
          voice: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
          audioConfig: { audioEncoding: 'MP3' },
        })
      )
      expect(res._status).toBe(200)
      expect(res._json).toHaveProperty('audio')
    })

    it('should return 500 on client error', async () => {
      mockSynthesizeSpeech.mockRejectedValue(new Error('Auth error'))

      const req = createMockReq({
        body: { message: 'test', ttsType: 'en', languageCode: 'en-US' },
      })
      const res = createMockRes()

      await handler(req, res)

      expect(res._status).toBe(500)
      expect(res._json).toEqual({ error: 'Internal Server Error' })
    })
  })

  it('should default languageCode to ja-JP', async () => {
    const audioContent = Buffer.from('audio')
    mockSynthesizeSpeech.mockResolvedValue([{ audioContent }])

    const req = createMockReq({
      body: { message: 'test', ttsType: 'ja-JP-Standard-B' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
      expect.objectContaining({
        voice: { languageCode: 'ja-JP', name: 'ja-JP-Standard-B' },
      })
    )
  })
})
