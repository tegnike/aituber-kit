import handler from '@/pages/api/ai/vercel'
import {
  createAIRegistry,
  streamAiText,
  generateAiText,
} from '@/lib/api-services/vercelAi'
import { modifyMessages } from '@/lib/api-services/utils'
import { createMocks } from 'node-mocks-http'
import { hostname as getHostname } from 'node:os'

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
    delete process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE
    delete process.env.AITUBERKIT_ALLOWED_LLM_SERVER_ORIGINS
    mockCreateAIRegistry.mockReturnValue(mockRegistry as any)
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('rejects non-POST requests', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req as any, res as any)
    expect(res._getStatusCode()).toBe(405)
    expect(res._getJSONData()).toEqual({ error: 'Method not allowed' })
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

  it('rejects server-side API keys by default', async () => {
    process.env.OPENAI_API_KEY = 'env-openai'
    delete process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE

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
    expect(res._getStatusCode()).toBe(403)
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'ai/vercel',
      })
    )
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

  it.each(['ollama', 'lmstudio'])(
    'allows same-machine %s loopback URLs by default',
    async (aiService) => {
      mockModifyMessages.mockReturnValue([
        { role: 'user', content: 'hello' },
      ] as any)
      mockGenerateAiText.mockResolvedValue(
        new Response('done', { status: 200 })
      )
      const localLlmUrl =
        aiService === 'ollama'
          ? 'http://127.0.0.1:11434'
          : 'http://localhost:1234/v1'
      const { req, res } = createMocks({
        method: 'POST',
        headers: { host: 'localhost:3000' },
        body: {
          messages: [],
          apiKey: '',
          aiService,
          model: 'local-model',
          localLlmUrl,
          stream: false,
          temperature: 1,
          maxTokens: 10,
        },
      })
      req.socket.remoteAddress = '127.0.0.1'

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      expect(mockCreateAIRegistry).toHaveBeenCalledWith(aiService, {
        apiKey: '',
        baseURL: localLlmUrl,
        resourceName: '',
      })
      expect(mockGenerateAiText).toHaveBeenCalled()
    }
  )

  it('allows the same-machine LM Studio hostname by default', async () => {
    mockModifyMessages.mockReturnValue([
      { role: 'user', content: 'hello' },
    ] as any)
    mockGenerateAiText.mockResolvedValue(new Response('done', { status: 200 }))
    const localLlmUrl = `http://${getHostname()}:1234/v1`
    const { req, res } = createMocks({
      method: 'POST',
      headers: { host: 'localhost:3000' },
      body: {
        messages: [],
        apiKey: '',
        aiService: 'lmstudio',
        model: 'local-model',
        localLlmUrl,
        stream: false,
        temperature: 1,
        maxTokens: 10,
      },
    })
    req.socket.remoteAddress = '127.0.0.1'

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    expect(mockCreateAIRegistry).toHaveBeenCalledWith('lmstudio', {
      apiKey: '',
      baseURL: localLlmUrl,
      resourceName: '',
    })
  })

  it('rejects remote requests to local LLM loopback URLs by default', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { host: 'aituberkit.example.com' },
      body: {
        messages: [],
        apiKey: '',
        aiService: 'ollama',
        model: 'llama3',
        localLlmUrl: 'http://127.0.0.1:11434',
        stream: false,
        temperature: 1,
        maxTokens: 10,
      },
    })
    req.socket.remoteAddress = '198.51.100.20'

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(403)
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'ai/vercel',
      })
    )
    expect(mockCreateAIRegistry).not.toHaveBeenCalled()
  })

  it('rejects non-HTTP local LLM URLs', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: '',
        aiService: 'lmstudio',
        model: 'local-model',
        localLlmUrl: 'file:///etc/passwd',
        stream: false,
        temperature: 1,
        maxTokens: 10,
      },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(400)
    expect(res._getJSONData()).toEqual({
      error: 'Invalid Local LLM URL protocol',
      errorCode: 'AIInvalidProperty',
    })
    expect(mockCreateAIRegistry).not.toHaveBeenCalled()
  })

  it('rejects non-allowlisted public local LLM URLs', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: '',
        aiService: 'lmstudio',
        model: 'local-model',
        localLlmUrl: 'https://llm.example/v1',
        stream: false,
        temperature: 1,
        maxTokens: 10,
      },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(400)
    expect(res._getJSONData()).toEqual({
      error: 'Local LLM URL is not allowed',
      errorCode: 'AIInvalidProperty',
    })
    expect(mockCreateAIRegistry).not.toHaveBeenCalled()
  })

  it.each(['http://STUDIO-PC:1234/v1', 'http://studio-mac.local:1234/v1'])(
    'allows LM Studio LAN machine-name URL %s',
    async (localLlmUrl) => {
      process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'unprotected'
      mockModifyMessages.mockReturnValue([
        { role: 'user', content: 'hi' },
      ] as any)
      mockGenerateAiText.mockResolvedValue(
        new Response('done', { status: 200 })
      )
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          messages: [],
          apiKey: '',
          aiService: 'lmstudio',
          model: 'local-model',
          localLlmUrl,
          stream: false,
          temperature: 1,
          maxTokens: 10,
        },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      expect(mockCreateAIRegistry).toHaveBeenCalledWith('lmstudio', {
        apiKey: '',
        baseURL: localLlmUrl,
        resourceName: '',
      })
    }
  )

  it('guards LM Studio machine-name URLs as protected resources', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: '',
        aiService: 'lmstudio',
        model: 'local-model',
        localLlmUrl: 'http://STUDIO-PC:1234/v1',
        stream: false,
        temperature: 1,
        maxTokens: 10,
      },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(403)
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        errorCode: 'ServerSecretAccessDenied',
        feature: 'ai/vercel',
      })
    )
    expect(mockCreateAIRegistry).not.toHaveBeenCalled()
  })

  it('allows explicitly allowlisted public local LLM URLs', async () => {
    process.env.AITUBERKIT_ALLOWED_LLM_SERVER_ORIGINS = 'https://llm.example'
    mockModifyMessages.mockReturnValue([{ role: 'user', content: 'hi' }] as any)
    mockGenerateAiText.mockResolvedValue(new Response('done', { status: 200 }))
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: '',
        aiService: 'lmstudio',
        model: 'local-model',
        localLlmUrl: 'https://llm.example/v1',
        stream: false,
        temperature: 1,
        maxTokens: 10,
      },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    expect(mockCreateAIRegistry).toHaveBeenCalledWith('lmstudio', {
      apiKey: '',
      baseURL: 'https://llm.example/v1',
      resourceName: '',
    })
  })

  it('streams google responses with search grounding using env API key', async () => {
    process.env.GOOGLE_KEY = 'env-google'
    process.env.AITUBERKIT_SERVER_SECRET_ACCESS_MODE = 'unprotected'
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
        model: 'gemini-2.5-pro',
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
      model: 'gemini-2.5-pro',
      registry: mockRegistry,
      service: 'google',
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.8,
      maxTokens: 500,
      options: {
        useSearchGrounding: true,
        dynamicRetrievalConfig: { dynamicThreshold: 0.42 },
      },
      providerOptions: undefined,
    })
  })

  it('does not guard non-azure requests only because AZURE_ENDPOINT is configured', async () => {
    process.env.AZURE_ENDPOINT =
      'https://my-resource.openai.azure.com/openai/deployments/my-deploy/chat/completions?api-version=2024-05-01-preview'
    mockModifyMessages.mockReturnValue([{ role: 'user', content: 'hi' }] as any)

    const generateResponse = new Response('done', { status: 200 })
    mockGenerateAiText.mockResolvedValue(generateResponse)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: 'openai-key',
        aiService: 'openai',
        model: 'gpt-4.1',
        stream: false,
        temperature: 0.3,
        maxTokens: 256,
      },
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).not.toBe(403)
    expect(mockCreateAIRegistry).toHaveBeenCalledWith('openai', {
      apiKey: 'openai-key',
      baseURL: undefined,
      resourceName: '',
    })
    expect(mockGenerateAiText).toHaveBeenCalled()
  })

  it('uses custom OpenAI model reasoning defaults', async () => {
    mockModifyMessages.mockReturnValue([{ role: 'user', content: 'hi' }] as any)
    mockGenerateAiText.mockResolvedValue(new Response('done', { status: 200 }))
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        messages: [],
        apiKey: 'openai-key',
        aiService: 'openai',
        model: 'gpt-5-pro',
        stream: false,
        reasoningMode: true,
        reasoningEffort: 'low',
        reasoningTokenBudget: 8192,
        customModel: true,
      },
    })

    await handler(req as any, res as any)

    expect(mockGenerateAiText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: {
          openai: {
            reasoningEffort: 'low',
            reasoningSummary: 'detailed',
          },
        },
      })
    )
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
