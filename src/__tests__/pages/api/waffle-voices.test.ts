/**
 * @jest-environment node
 */

import handler from '@/pages/api/waffle-voices'
import {
  createMockReq,
  createMockRes,
  mockServerSecretGuard,
} from '../../helpers/apiRouteTestUtils'

const originalEnv = { ...process.env }
const originalFetch = global.fetch

describe('/api/waffle-voices', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.ANIWAFFLE_API_KEY
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
    const req = createMockReq({ body: {} })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should return only the id and name of each voice', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        voices: [
          { id: 'variant_1', name: '凪', nsfw: false, capabilities: ['tts'] },
          { id: 'variant_2', name: 'Ellis' },
          { id: 3, name: 'broken' },
        ],
      }),
    })

    const req = createMockReq({ body: { apiKey: 'key' } })
    const res = createMockRes()

    await handler(req, res)

    expect(global.fetch).toHaveBeenCalledWith(
      'https://aniwaffle.com/v1/voices',
      { headers: { Authorization: 'Bearer key' } }
    )
    expect(res._status).toBe(200)
    expect(res._json).toEqual({
      voices: [
        { id: 'variant_1', name: '凪' },
        { id: 'variant_2', name: 'Ellis' },
      ],
    })
  })

  it('should reject server env key usage when guard mode is not configured', async () => {
    process.env.ANIWAFFLE_API_KEY = 'server-key'

    const req = createMockReq({ body: {} })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(403)
    expect(res._json).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'waffle-voices',
      })
    )
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should allow server env key usage from same-origin request in demo mode', async () => {
    const { headers } = mockServerSecretGuard('demo')
    process.env.ANIWAFFLE_API_KEY = 'server-key'
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ voices: [] }),
    })

    const req = createMockReq({ body: {}, headers })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(200)
    expect(res._json).toEqual({ voices: [] })
  })

  it('should pass the upstream status through on API errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 })

    const req = createMockReq({ body: { apiKey: 'bad' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(401)
    expect(res._json).toEqual({ error: expect.stringContaining('401') })
  })

  it('should respond 502 when the list is not an array', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ voices: 'nope' }),
    })

    const req = createMockReq({ body: { apiKey: 'key' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(502)
  })

  it('should respond 500 when the request fails', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const req = createMockReq({ body: { apiKey: 'key' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(500)
    expect(res._json).toEqual({ error: 'Network error' })
  })
})
