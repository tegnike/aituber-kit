import { handleCustomApi } from '@/lib/api-services/customApi'

const originalFetch = global.fetch
const originalEnv = { ...process.env }

if (typeof global.Response === 'undefined') {
  class TestResponse {
    public status: number
    public ok: boolean
    public headers: Map<string, string>
    public body: any

    constructor(body?: any, init: { status?: number; headers?: any } = {}) {
      this.body = body
      this.status = init.status ?? 200
      this.ok = this.status >= 200 && this.status < 300
      this.headers = new Map(Object.entries(init.headers || {}))
    }

    async text() {
      if (typeof this.body === 'string') return this.body
      if (!this.body?.getReader) return ''

      const reader = this.body.getReader()
      const decoder = new TextDecoder()
      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
      }
      result += decoder.decode()
      return result
    }

    async json() {
      return JSON.parse(await this.text())
    }
  }

  // @ts-expect-error – provide Response polyfill for test environment
  global.Response = TestResponse
}

function createStreamResponse(body: string): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(body))
        controller.close()
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    }
  )
}

describe('handleCustomApi', () => {
  beforeEach(() => {
    process.env = { ...originalEnv }
    global.fetch = jest.fn()
  })

  afterAll(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  it('forwards text deltas while filtering reasoning and provider metadata by default', async () => {
    const upstream = [
      'data: {"type":"start","payload":{"id":"internal"}}',
      'data: {"type":"reasoning-delta","delta":"hidden reasoning"}',
      'data: {"type":"text-delta","delta":"hello"}',
      'data: {"type":"step-finish","payload":{"metadata":{"headers":{"x-request-id":"secret"}}}}',
      'data: [DONE]',
      '',
    ].join('\n')
    ;(global.fetch as jest.Mock).mockResolvedValue(
      createStreamResponse(upstream)
    )

    const response = await handleCustomApi(
      [{ role: 'user', content: 'hi' } as any],
      'https://example.com/custom',
      '{}',
      '{}',
      true
    )

    const text = await response.text()
    expect(text).toContain('data: {"type":"text-delta","delta":"hello"}')
    expect(text).toContain('data: [DONE]')
    expect(text).not.toContain('hidden reasoning')
    expect(text).not.toContain('x-request-id')
    expect(text).not.toContain('"type":"start"')
  })

  it('can forward metadata when explicitly enabled', async () => {
    process.env.AITUBERKIT_FORWARD_CUSTOM_API_METADATA = 'true'
    const upstream = [
      'data: {"type":"reasoning-delta","delta":"visible reasoning"}',
      'data: {"type":"step-finish","payload":{"metadata":{"id":"response-id"}}}',
      '',
    ].join('\n')
    ;(global.fetch as jest.Mock).mockResolvedValue(
      createStreamResponse(upstream)
    )

    const response = await handleCustomApi(
      [{ role: 'user', content: 'hi' } as any],
      'https://example.com/custom',
      '{}',
      '{}',
      true
    )

    const text = await response.text()
    expect(text).toContain('visible reasoning')
    expect(text).toContain('response-id')
  })
})
