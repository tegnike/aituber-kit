/**
 * @jest-environment node
 */

import handler from '@/pages/api/tts-waffle'
import {
  createMockReq,
  createMockRes,
  mockServerSecretGuard,
} from '../../helpers/apiRouteTestUtils'

const originalEnv = { ...process.env }
const originalFetch = global.fetch

function pcmResponse(bytes: number, channels = '1') {
  return {
    ok: true,
    headers: new Headers({ 'x-audio-channels': channels }),
    arrayBuffer: async () => new ArrayBuffer(bytes),
  }
}

describe('/api/tts-waffle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.ANIWAFFLE_API_KEY
    delete process.env.ANIWAFFLE_VOICE_ID
    delete process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE
    global.fetch = jest.fn()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it('should respond 400 json when API key is missing', async () => {
    const req = createMockReq({ body: { message: 'hello', voiceId: 'v1' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._ended).toBe(true)
    expect(res._status).toBe(400)
    expect(res._json).toEqual({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should fall back to the built-in voice when voice ID is missing', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(pcmResponse(8))

    const req = createMockReq({ body: { message: 'hello', apiKey: 'key' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(200)
    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    )
    expect(requestBody.voice_id).toBe('builtin_voice_062')
  })

  it('should prefer ANIWAFFLE_VOICE_ID over the built-in voice', async () => {
    const { headers } = mockServerSecretGuard('demo')
    process.env.ANIWAFFLE_VOICE_ID = 'server-voice'
    ;(global.fetch as jest.Mock).mockResolvedValue(pcmResponse(8))

    const req = createMockReq({
      body: { message: 'hello', apiKey: 'key', voiceId: '' },
      headers,
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(200)
    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    )
    expect(requestBody.voice_id).toBe('server-voice')
  })

  it('should respond 400 json when the body is null', async () => {
    const req = createMockReq({ body: null })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should respond 400 json when message is missing', async () => {
    const req = createMockReq({ body: { apiKey: 'key' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({
      error: 'Empty message',
      errorCode: 'EMPTY_PROPERTY',
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should request 48 kHz PCM and return it as WAV', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(pcmResponse(96))

    const req = createMockReq({
      body: {
        message: '<happy>こんにちは</happy>',
        apiKey: 'key',
        voiceId: 'v1',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://aniwaffle.com/v1/tts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer key' }),
      })
    )
    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    )
    expect(requestBody).toEqual({
      text: '<happy>こんにちは</happy>',
      voice_id: 'v1',
      output_format: 'pcm_48000',
    })
    expect(res._status).toBe(200)
    expect(res._headers['Content-Type']).toBe('audio/wav')

    const wav = res._body as Buffer
    expect(wav.length).toBe(44 + 96)
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF')
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE')
    expect(wav.readUInt16LE(22)).toBe(1) // channels
    expect(wav.readUInt32LE(24)).toBe(48000) // sample rate
    expect(wav.readUInt32LE(40)).toBe(96) // data size
  })

  it('should keep both channels when Waffle returns stereo', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(pcmResponse(16, '2'))

    const req = createMockReq({
      body: { message: 'hello', apiKey: 'key', voiceId: 'v1' },
    })
    const res = createMockRes()

    await handler(req, res)

    const wav = res._body as Buffer
    expect(wav.readUInt16LE(22)).toBe(2)
    expect(wav.readUInt32LE(28)).toBe(48000 * 2 * 2) // byte rate
  })

  it('should reject server env key usage when guard mode is not configured', async () => {
    process.env.ANIWAFFLE_API_KEY = 'server-key'
    process.env.ANIWAFFLE_VOICE_ID = 'server-voice'

    const req = createMockReq({ body: { message: 'hello' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(403)
    expect(res._json).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'waffle',
      })
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should allow server env key usage from same-origin request in demo mode', async () => {
    const { headers } = mockServerSecretGuard('demo')
    process.env.ANIWAFFLE_API_KEY = 'server-key'
    process.env.ANIWAFFLE_VOICE_ID = 'server-voice'
    ;(global.fetch as jest.Mock).mockResolvedValue(pcmResponse(8))

    const req = createMockReq({ body: { message: 'hello' }, headers })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(res._headers['Content-Type']).toBe('audio/wav')
  })

  it('should pass the upstream status through on API errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => '{"code":"rate_limited","retryable":true}',
    })

    const req = createMockReq({
      body: { message: 'hello', apiKey: 'key', voiceId: 'v1' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(429)
    expect(res._json).toEqual({
      error: expect.stringContaining('rate_limited'),
    })
  })

  it('should respond 500 when the request fails', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const req = createMockReq({
      body: { message: 'hello', apiKey: 'key', voiceId: 'v1' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'Network error' })
  })
})
