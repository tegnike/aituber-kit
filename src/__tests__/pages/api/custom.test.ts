import handler from '@/pages/api/ai/custom'
import { handleCustomApi } from '@/lib/api-services/customApi'
import { createMocks } from 'node-mocks-http'

if (typeof global.Response === 'undefined') {
  class MockResponse {
    public status: number
    private readonly body: any

    constructor(body?: any, init: { status?: number; headers?: any } = {}) {
      this.body = body
      this.status = init.status ?? 200
    }

    async text() {
      if (typeof this.body === 'string') return this.body
      if (this.body == null) return ''
      return JSON.stringify(this.body)
    }
  }
  // @ts-expect-error – provide Response polyfill for test environment
  global.Response = MockResponse
}

jest.mock('@/lib/api-services/customApi', () => ({
  handleCustomApi: jest.fn(),
}))

jest.mock('@/utils/pipeResponse', () => ({
  pipeResponse: jest.fn(async (response: any, res: any) => {
    res.status(response.status)
    const text = await response.text()
    if (text) {
      res.write(text)
    }
    res.end()
  }),
}))

const mockHandleCustomApi = handleCustomApi as jest.MockedFunction<
  typeof handleCustomApi
>

const originalEnv = { ...process.env }

describe('/api/ai/custom handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('rejects non-POST requests', async () => {
    const { req, res } = createMocks({ method: 'GET' })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(405)
    expect(res._getJSONData()).toEqual({
      error: 'Method Not Allowed',
      errorCode: 'METHOD_NOT_ALLOWED',
    })
  })

  it('rejects server-side custom API settings by default', async () => {
    process.env.CUSTOM_API_URL = 'https://example.com/api'
    process.env.CUSTOM_API_HEADERS = '{"Authorization":"Bearer secret"}'
    delete process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'hello' }],
        stream: true,
      },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(403)
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'ai/custom',
      })
    )
    expect(mockHandleCustomApi).not.toHaveBeenCalled()
  })

  it('allows protected server-side custom API settings with a bearer token', async () => {
    process.env.CUSTOM_API_URL = 'https://example.com/api'
    process.env.CUSTOM_API_HEADERS = '{"Authorization":"Bearer secret"}'
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'protected'
    process.env.AITUBERKIT_SERVER_SECRET_TOKEN = 'server-token'
    mockHandleCustomApi.mockResolvedValue(new Response('ok', { status: 200 }))

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer server-token' },
      body: {
        messages: [{ role: 'user', content: 'hello' }],
        stream: true,
      },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    expect(mockHandleCustomApi).toHaveBeenCalledWith(
      [{ role: 'user', content: 'hello' }],
      'https://example.com/api',
      '{"Authorization":"Bearer secret"}',
      '{}',
      true,
      false
    )
  })
})
