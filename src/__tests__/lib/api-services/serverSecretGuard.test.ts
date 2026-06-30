import { createMocks } from 'node-mocks-http'
import { guardServerSecretAccess } from '@/lib/api-services/serverSecretGuard'

const originalEnv = { ...process.env }

describe('serverSecretGuard', () => {
  beforeEach(() => {
    process.env = { ...originalEnv }
    delete (globalThis as any).__aituberKitServerSecretRateLimit
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('denies server secret access by default', () => {
    const { req, res } = createMocks({ method: 'POST' })

    const allowed = guardServerSecretAccess(req as any, res as any, {
      featureName: 'test-feature',
    })

    expect(allowed).toBe(false)
    expect(res._getStatusCode()).toBe(403)
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'test-feature',
      })
    )
  })

  it('allows protected mode with a matching bearer token', () => {
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'protected'
    process.env.AITUBERKIT_SERVER_SECRET_TOKEN = 'secret-token'
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer secret-token' },
    })

    const allowed = guardServerSecretAccess(req as any, res as any, {
      featureName: 'test-feature',
    })

    expect(allowed).toBe(true)
    expect(res._getStatusCode()).toBe(200)
  })

  it('allows demo mode only for same-origin requests', () => {
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'demo'
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        host: 'aituberkit.example',
        origin: 'https://aituberkit.example',
        'sec-fetch-site': 'same-origin',
      },
    })

    const allowed = guardServerSecretAccess(req as any, res as any, {
      featureName: 'test-feature',
    })

    expect(allowed).toBe(true)
    expect(res._getStatusCode()).toBe(200)
  })

  it('rejects demo mode cross-site requests', () => {
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'demo'
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        host: 'aituberkit.example',
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
      },
    })

    const allowed = guardServerSecretAccess(req as any, res as any, {
      featureName: 'test-feature',
    })

    expect(allowed).toBe(false)
    expect(res._getStatusCode()).toBe(403)
  })

  it('rate limits demo mode requests per feature and client IP', () => {
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'demo'
    process.env.AITUBERKIT_DEMO_RATE_LIMIT_PER_MINUTE = '1'

    const createSameOriginRequest = () =>
      createMocks({
        method: 'POST',
        headers: {
          host: 'aituberkit.example',
          origin: 'https://aituberkit.example',
          'sec-fetch-site': 'same-origin',
          'x-forwarded-for': '203.0.113.10',
        },
      })

    const first = createSameOriginRequest()
    expect(
      guardServerSecretAccess(first.req as any, first.res as any, {
        featureName: 'test-feature',
      })
    ).toBe(true)

    const second = createSameOriginRequest()
    expect(
      guardServerSecretAccess(second.req as any, second.res as any, {
        featureName: 'test-feature',
      })
    ).toBe(false)
    expect(second.res._getStatusCode()).toBe(429)
    expect(second.res._getJSONData()).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretRateLimited',
        feature: 'test-feature',
      })
    )
  })
})
