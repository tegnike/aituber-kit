import handler from '@/pages/api/ai/live-session'
import {
  createMockReq,
  createMockRes,
  mockServerSecretGuard,
} from '../../helpers/apiRouteTestUtils'
const originalFetch = global.fetch
const originalEnv = process.env
const mockFetch = jest.fn()
const body = {
  apiKey: 'test-key',
  sdp: 'v=0\r\n',
  instructions: 'Be helpful',
  history: [{ role: 'assistant', content: 'Hello' }],
}
beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...originalEnv }
  delete process.env.OPENAI_KEY
  delete process.env.OPENAI_API_KEY
  global.fetch = mockFetch
  mockServerSecretGuard('disabled')
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      session: { id: 'live_123', private: 'do not forward' },
      transport: { sdp: 'v=0\r\n' },
    }),
  })
})
afterEach(() => {
  process.env = originalEnv
  global.fetch = originalFetch
})
test('dedicated API, server-shaped Responses delegation and safe response', async () => {
  const res = createMockRes()
  await handler(createMockReq({ body: { ...body, webSearch: true } }), res)
  expect(res._status).toBe(201)
  const [url, request] = mockFetch.mock.calls[0]
  expect(url).toBe('https://api.openai.com/v1/live/sessions')
  const payload = JSON.parse(request.body)
  expect(payload.session.model).toBe('gpt-live-1')
  expect(payload.session.delegation.responses.tools).toEqual([
    { type: 'web_search' },
  ])
  expect(payload.session.input[0].content[0].type).toBe('output_text')
  expect(payload.session.audio).toEqual({ output: { voice: 'marin' } })
  expect(payload.transport.type).toBe('webrtc')
  expect(res._json).toEqual({
    session: { id: 'live_123' },
    transport: { type: 'webrtc', sdp: 'v=0\r\n' },
  })
})
test.each([
  { sdp: '' },
  { voice: 'unknown' },
  { backendModel: '' },
  { history: [{ role: 'system', content: 'x' }] },
])('rejects invalid configuration before billing: %j', async (invalid) => {
  const res = createMockRes()
  await handler(createMockReq({ body: { ...body, ...invalid } }), res)
  expect(res._status).toBe(400)
  expect(mockFetch).not.toHaveBeenCalled()
})
test('requires credentials', async () => {
  const res = createMockRes()
  await handler(createMockReq({ body: { ...body, apiKey: '' } }), res)
  expect(res._status).toBe(400)
  expect(mockFetch).not.toHaveBeenCalled()
})
test('upstream rejection is sanitized', async () => {
  mockFetch.mockResolvedValue({
    ok: false,
    status: 403,
    json: async () => ({}),
  })
  const res = createMockRes()
  await handler(createMockReq({ body }), res)
  expect(res._status).toBe(403)
  expect(res._json).toEqual({
    error: 'GPT-Live session creation failed',
    errorCode: 'LiveSessionCreationFailed',
  })
})

test('server keys obey the existing access policy', async () => {
  process.env.OPENAI_API_KEY = 'server-test-key'
  mockServerSecretGuard('protected')
  const res = createMockRes()
  await handler(createMockReq({ body: { ...body, apiKey: '' } }), res)
  expect(res._status).toBe(403)
  expect(mockFetch).not.toHaveBeenCalled()
})

test.each([
  [35, 201],
  [129, 400],
])('history length %i respects API limit', async (count, status) => {
  const res = createMockRes()
  await handler(
    createMockReq({
      body: {
        ...body,
        history: Array.from({ length: count }, () => ({
          role: 'user',
          content: 'Hi',
        })),
      },
    }),
    res
  )
  expect(res._status).toBe(status)
})

test('forwards long text unchanged instead of imposing character limits', async () => {
  const res = createMockRes()
  const content = 'hello '.repeat(1500)
  const instructions = 'hi '.repeat(6000)
  await handler(
    createMockReq({
      body: { ...body, instructions, history: [{ role: 'user', content }] },
    }),
    res
  )
  expect(res._status).toBe(201)
  const payload = JSON.parse(mockFetch.mock.calls[0][1].body)
  expect(payload.session.input[0].content[0].text).toBe(content)
  expect(payload.session.instructions.startsWith(instructions)).toBe(true)
})
test.each([
  ['session.input', 'LiveHistoryLimitExceeded'],
  ['session.instructions', 'LiveInstructionsLimitExceeded'],
  ['', 'LiveTokenLimitExceeded'],
])(
  'reports official token limit error for %s without leaking upstream text',
  async (param, errorCode) => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { param, message: 'Maximum token limit exceeded: private-text' },
      }),
    })
    const res = createMockRes()
    await handler(createMockReq({ body }), res)
    expect(res._status).toBe(400)
    expect(res._json.errorCode).toBe(errorCode)
    expect(JSON.stringify(res._json)).not.toContain('private-text')
  }
)
