import handler from '@/pages/api/ai/realtime-client-secret'
import {
  createMockReq,
  createMockRes,
  mockServerSecretGuard,
} from '../../helpers/apiRouteTestUtils'

const mockFetch = jest.fn()
const originalFetch = global.fetch
const originalEnv = process.env

describe('/api/ai/realtime-client-secret', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.OPENAI_KEY
    delete process.env.OPENAI_API_KEY
    global.fetch = mockFetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = originalEnv
  })

  it('クライアントキーでRealtime client secretを発行する', async () => {
    mockServerSecretGuard('disabled')
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        value: 'ek_test',
        expires_at: 1234567890,
        session: { id: 'sess_1' },
      }),
    })

    const req = createMockReq({
      body: {
        apiKey: 'client-key',
        model: 'gpt-realtime-2.1',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/realtime/client_secrets',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer client-key',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          session: {
            type: 'realtime',
            model: 'gpt-realtime-2.1',
          },
        }),
      })
    )
    expect(res._status).toBe(200)
    expect(res._json).toEqual({
      value: 'ek_test',
      expires_at: 1234567890,
      session: { id: 'sess_1' },
    })
  })

  it('gpt-live-transcribe用の文字起こしセッションを発行する', async () => {
    mockServerSecretGuard('disabled')
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ value: 'ek_transcription' }),
    })

    const req = createMockReq({
      body: {
        apiKey: 'client-key',
        model: 'gpt-live-transcribe',
        sessionType: 'transcription',
        languages: ['JA', 'invalid language'],
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/realtime/client_secrets',
      expect.objectContaining({
        body: JSON.stringify({
          session: {
            type: 'transcription',
            audio: {
              input: {
                format: { type: 'audio/pcm', rate: 24000 },
                transcription: {
                  model: 'gpt-live-transcribe',
                  delay: 'low',
                  languages: ['ja'],
                },
                turn_detection: null,
              },
            },
          },
        }),
      })
    )
    expect(res._status).toBe(200)
    expect(res._json).toEqual({ value: 'ek_transcription' })
  })

  it('文字起こしセッションでは未対応モデルを拒否する', async () => {
    mockServerSecretGuard('disabled')
    const req = createMockReq({
      body: {
        apiKey: 'client-key',
        model: 'gpt-realtime-2.1',
        sessionType: 'transcription',
      },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({
      error: 'Unsupported live transcription model',
      errorCode: 'InvalidLiveTranscriptionModel',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('サーバーキー使用時はアクセスガードを評価する', async () => {
    mockServerSecretGuard('disabled')
    process.env.OPENAI_API_KEY = 'server-key'

    const req = createMockReq({ body: { model: 'gpt-realtime-2.1' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(403)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('demoモードではsame-originリクエストでサーバーキーを使える', async () => {
    const { headers } = mockServerSecretGuard('demo')
    process.env.OPENAI_API_KEY = 'server-key'
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ value: 'ek_demo' }),
    })

    const req = createMockReq({
      headers,
      body: { model: 'gpt-realtime-2.1' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer server-key',
        }),
      })
    )
    expect(res._status).toBe(200)
    expect(res._json).toEqual({ value: 'ek_demo' })
  })

  it('キーが無い場合は400 EmptyAPIKeyを返す', async () => {
    mockServerSecretGuard('unprotected')

    const req = createMockReq({ body: {} })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('廃止予定のRealtime APIモデルを拒否する', async () => {
    mockServerSecretGuard('disabled')
    const req = createMockReq({
      body: { apiKey: 'client-key', model: 'gpt-realtime' },
    })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(400)
    expect(res._json).toEqual({
      error: 'Unsupported Realtime API model',
      errorCode: 'InvalidRealtimeModel',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('OpenAI上流エラーをステータス付きで返す', async () => {
    mockServerSecretGuard('unprotected')
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'invalid api key' } }),
    })

    const req = createMockReq({ body: { apiKey: 'bad-key' } })
    const res = createMockRes()

    await handler(req, res)

    expect(res._status).toBe(401)
    expect(res._json).toEqual({
      error: 'invalid api key',
      errorCode: 'OpenAIRealtimeClientSecretError',
    })
  })
})
