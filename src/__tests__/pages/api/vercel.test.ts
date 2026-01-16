import handler from '@/pages/api/ai/vercel'
import {
  aiServiceConfig,
  streamAiText,
  generateAiText,
} from '@/lib/api-services/vercelAi'
import { modifyMessages } from '@/lib/api-services/utils'

class TestResponse {
  public status: number
  private readonly body: any

  constructor(body?: any, init: { status?: number } = {}) {
    this.body = body
    this.status = init.status ?? 200
  }

  async json() {
    if (typeof this.body === 'string') {
      return this.body ? JSON.parse(this.body) : null
    }
    return this.body
  }

  async text() {
    if (typeof this.body === 'string') {
      return this.body
    }
    if (this.body === undefined || this.body === null) {
      return ''
    }
    return JSON.stringify(this.body)
  }
}

if (typeof global.Response === 'undefined') {
  // @ts-expect-error – provide a minimal Response polyfill for handler tests
  global.Response = TestResponse
}

jest.mock('@/lib/api-services/vercelAi', () => ({
  aiServiceConfig: {
    google: jest.fn(),
    azure: jest.fn(),
    ollama: jest.fn(),
    openai: jest.fn(),
  },
  streamAiText: jest.fn(),
  generateAiText: jest.fn(),
}))

jest.mock('@/lib/api-services/utils', () => ({
  modifyMessages: jest.fn(),
}))

const mockStreamAiText = streamAiText as jest.MockedFunction<
  typeof streamAiText
>
const mockGenerateAiText = generateAiText as jest.MockedFunction<
  typeof generateAiText
>
const mockModifyMessages = modifyMessages as jest.MockedFunction<
  typeof modifyMessages
>

const buildRequest = (body: any): any => ({
  method: 'POST',
  json: async () => body,
})

const originalEnv = { ...process.env }

describe('/api/ai/vercel handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('rejects non-POST requests', async () => {
    const res = await handler({ method: 'GET' } as any)
    expect(res.status).toBe(405)
    await expect(res.json()).resolves.toEqual({
      error: 'Method Not Allowed',
      errorCode: 'METHOD_NOT_ALLOWED',
    })
  })

  it('returns 400 when API key is missing for cloud providers', async () => {
    delete process.env.OPENAI_KEY
    delete process.env.OPENAI_API_KEY

    const res = await handler(
      buildRequest({
        messages: [],
        apiKey: '',
        aiService: 'openai',
        model: 'gpt-4.1',
        stream: true,
        temperature: 1,
        maxTokens: 10,
      })
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })
  })

  it('returns 400 when local services lack a URL', async () => {
    const res = await handler(
      buildRequest({
        messages: [],
        apiKey: '',
        aiService: 'ollama',
        model: 'llama3',
        localLlmUrl: '',
        stream: true,
        temperature: 1,
        maxTokens: 10,
      })
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: 'Empty Local LLM URL',
      errorCode: 'EmptyLocalLLMURL',
    })
  })

  it('streams google responses with search grounding using env API key', async () => {
    process.env.GOOGLE_KEY = 'env-google'
    const googleModelFactory = jest
      .fn()
      .mockReturnValue('google-model-instance')
    ;(aiServiceConfig.google as jest.Mock).mockReturnValue(googleModelFactory)
    mockModifyMessages.mockReturnValue([
      { role: 'user', content: 'hello' },
    ] as any)

    const streamResponse = new Response('stream', { status: 200 })
    mockStreamAiText.mockResolvedValue(streamResponse)

    const res = await handler(
      buildRequest({
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
      })
    )

    expect(aiServiceConfig.google).toHaveBeenCalledWith({
      apiKey: 'env-google',
    })
    expect(mockStreamAiText).toHaveBeenCalledWith({
      model: 'gemini-1.5-pro',
      modelInstance: googleModelFactory,
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.8,
      maxTokens: 500,
      options: {
        useSearchGrounding: true,
        dynamicRetrievalConfig: { dynamicThreshold: 0.42 },
      },
    })
    expect(res).toBe(streamResponse)
  })

  it('calls generateAiText for azure requests using deployment name', async () => {
    const azureModelFactory = jest.fn().mockReturnValue('azure-model-instance')
    ;(aiServiceConfig.azure as jest.Mock).mockReturnValue(azureModelFactory)
    mockModifyMessages.mockReturnValue([{ role: 'user', content: 'hi' }] as any)

    const generateResponse = new Response('done', { status: 200 })
    mockGenerateAiText.mockResolvedValue(generateResponse)

    const res = await handler(
      buildRequest({
        messages: [],
        apiKey: 'azure-key',
        aiService: 'azure',
        model: '',
        stream: false,
        temperature: 0.3,
        maxTokens: 256,
        azureEndpoint:
          'https://my-resource.openai.azure.com/openai/deployments/my-deploy/chat/completions?api-version=2024-05-01-preview',
      })
    )

    expect(aiServiceConfig.azure).toHaveBeenCalledWith({
      resourceName: 'my-resource',
      apiKey: 'azure-key',
    })
    expect(mockGenerateAiText).toHaveBeenCalledWith({
      model: 'my-deploy',
      modelInstance: azureModelFactory,
      messages: [{ role: 'user', content: 'hi' }],
      temperature: 0.3,
      maxTokens: 256,
    })
    expect(res).toBe(generateResponse)
  })
})
