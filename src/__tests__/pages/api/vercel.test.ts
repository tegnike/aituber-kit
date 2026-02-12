import handler from '@/pages/api/ai/vercel'
import {
  createAIRegistry,
  streamAiText,
  generateAiText,
} from '@/lib/api-services/vercelAi'
import { modifyMessages } from '@/lib/api-services/utils'
import { createMocks } from 'node-mocks-http'

// テスト環境でResponseが未定義の場合のポリフィル
if (typeof global.Response === 'undefined') {
  class MockResponse {
    public status: number
    public headers: Map<string, string>
    private readonly _body: any
    constructor(body?: any, init: { status?: number; headers?: any } = {}) {
      this._body = body
      this.status = init.status ?? 200
      this.headers = new Map(Object.entries(init.headers || {}))
    }
    async json() {
      return typeof this._body === 'string'
        ? JSON.parse(this._body)
        : this._body
    }
    async text() {
      if (typeof this._body === 'string') return this._body
      if (this._body == null) return ''
      return JSON.stringify(this._body)
    }
  }
  // @ts-expect-error – provide Response polyfill for test environment
  global.Response = MockResponse
}

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

const mockRegistry = {
  languageModel: jest.fn().mockReturnValue('mock-model'),
  google: jest.fn().mockReturnValue('google-model'),
  azure: jest.fn().mockReturnValue('azure-model'),
}

jest.mock('@/lib/api-services/vercelAi', () => ({
  createAIRegistry: jest.fn(),
  streamAiText: jest.fn(),
  generateAiText: jest.fn(),
}))

jest.mock('@/lib/api-services/utils', () => ({
  modifyMessages: jest.fn(),
}))

const mockCreateAIRegistry = createAIRegistry as jest.MockedFunction<
  typeof createAIRegistry
>
const mockStreamAiText = streamAiText as jest.MockedFunction<
  typeof streamAiText
>
const mockGenerateAiText = generateAiText as jest.MockedFunction<
  typeof generateAiText
>
const mockModifyMessages = modifyMessages as jest.MockedFunction<
  typeof modifyMessages
>

const originalEnv = { ...process.env }

describe('/api/ai/vercel handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    mockCreateAIRegistry.mockReturnValue(mockRegistry as any)
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

  it('returns 400 when API key is missing for cloud providers', async () => {
    delete process.env.OPENAI_KEY
    delete process.env.OPENAI_API_KEY

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: '',
        aiService: 'openai',
        model: 'gpt-4.1',
        stream: true,
        temperature: 1,
        maxTokens: 10,
      },
    })

    await handler(req as any, res as any)
    expect(res._getStatusCode()).toBe(400)
    expect(res._getJSONData()).toEqual({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })
  })

  it('returns 400 when local services lack a URL', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: '',
        aiService: 'ollama',
        model: 'llama3',
        localLlmUrl: '',
        stream: true,
        temperature: 1,
        maxTokens: 10,
      },
    })

    await handler(req as any, res as any)
    expect(res._getStatusCode()).toBe(400)
    expect(res._getJSONData()).toEqual({
      error: 'Empty Local LLM URL',
      errorCode: 'EmptyLocalLLMURL',
    })
  })

  it('streams google responses with search grounding using env API key', async () => {
    process.env.GOOGLE_KEY = 'env-google'
    mockModifyMessages.mockReturnValue([
      { role: 'user', content: 'hello' },
    ] as any)

    const streamResponse = new Response('stream', { status: 200 })
    mockStreamAiText.mockResolvedValue(streamResponse)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: '',
        aiService: 'google',
        model: 'gemini-1.5-pro',
        stream: true,
        temperature: 0.8,
        maxTokens: 500,
        localLlmUrl: '',
        azureEndpoint: '',
        useSearchGrounding: true,
        dynamicRetrievalThreshold: 0.42,
      },
    })

    await handler(req as any, res as any)

    expect(mockCreateAIRegistry).toHaveBeenCalledWith('google', {
      apiKey: 'env-google',
      baseURL: '',
      resourceName: '',
    })
    expect(mockStreamAiText).toHaveBeenCalledWith({
      model: 'gemini-1.5-pro',
      registry: mockRegistry,
      service: 'google',
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.8,
      maxTokens: 500,
      options: {
        useSearchGrounding: true,
        dynamicRetrievalConfig: { dynamicThreshold: 0.42 },
      },
    })
  })

  it('calls generateAiText for azure requests using deployment name', async () => {
    mockModifyMessages.mockReturnValue([{ role: 'user', content: 'hi' }] as any)

    const generateResponse = new Response('done', { status: 200 })
    mockGenerateAiText.mockResolvedValue(generateResponse)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: 'azure-key',
        aiService: 'azure',
        model: '',
        stream: false,
        temperature: 0.3,
        maxTokens: 256,
        azureEndpoint:
          'https://my-resource.openai.azure.com/openai/deployments/my-deploy/chat/completions?api-version=2024-05-01-preview',
      },
    })

    await handler(req as any, res as any)

    expect(mockCreateAIRegistry).toHaveBeenCalledWith('azure', {
      apiKey: 'azure-key',
      baseURL: undefined,
      resourceName: 'my-resource',
    })
    expect(mockGenerateAiText).toHaveBeenCalledWith({
      model: 'my-deploy',
      registry: mockRegistry,
      service: 'azure',
      messages: [{ role: 'user', content: 'hi' }],
      temperature: 0.3,
      maxTokens: 256,
    })
  })
})
