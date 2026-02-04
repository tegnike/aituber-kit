import {
  createAIRegistry,
  getLanguageModel,
  streamAiText,
  generateAiText,
} from '@/lib/api-services/vercelAi'
import { Message } from '@/features/messages/messages'
import { streamText, generateText, createProviderRegistry } from 'ai'

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
  // @ts-expect-error – provide a minimal Response polyfill for tests
  global.Response = TestResponse
}

jest.mock('ai', () => {
  const actual = jest.requireActual('ai')
  return {
    ...actual,
    streamText: jest.fn(),
    generateText: jest.fn(),
    createProviderRegistry: jest.fn(),
  }
})

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn().mockReturnValue(jest.fn()),
}))

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: jest.fn().mockReturnValue(jest.fn()),
}))

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn().mockReturnValue(jest.fn()),
}))

const mockStreamText = streamText as jest.MockedFunction<typeof streamText>
const mockGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>
const mockCreateProviderRegistry =
  createProviderRegistry as jest.MockedFunction<typeof createProviderRegistry>

const testMessages: Message[] = [
  {
    role: 'user',
    content: 'hello',
    timestamp: '2024-01-01T00:00:00Z',
  },
]

describe('vercelAi service helpers', () => {
  const mockLanguageModel = jest.fn().mockReturnValue('mock-model')
  const mockRegistry = {
    languageModel: mockLanguageModel,
    openai: jest.fn().mockReturnValue('openai-model'),
    google: jest.fn().mockReturnValue('google-model'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateProviderRegistry.mockReturnValue(mockRegistry as any)
    mockLanguageModel.mockReturnValue('mock-model')
  })

  describe('createAIRegistry', () => {
    it('creates registry for openai service', () => {
      const registry = createAIRegistry('openai', { apiKey: 'test-key' })
      expect(registry).toBeDefined()
      expect(mockCreateProviderRegistry).toHaveBeenCalled()
    })

    it('creates registry for google service', () => {
      const registry = createAIRegistry('google', { apiKey: 'google-key' })
      expect(registry).toBeDefined()
      expect(mockCreateProviderRegistry).toHaveBeenCalled()
    })

    it('returns null for custom-api service', () => {
      const registry = createAIRegistry('custom-api', {})
      expect(registry).toBeNull()
    })
  })

  describe('getLanguageModel', () => {
    it('retrieves model from registry using modelId', () => {
      const model = getLanguageModel(mockRegistry as any, 'openai', 'gpt-4o')
      expect(mockLanguageModel).toHaveBeenCalledWith('openai:gpt-4o')
      expect(model).toBe('mock-model')
    })

    it('uses provider directly when options are provided', () => {
      const model = getLanguageModel(
        mockRegistry as any,
        'google',
        'gemini-pro',
        {
          useSearchGrounding: true,
        }
      )
      expect(mockRegistry.google).toHaveBeenCalledWith('gemini-pro', {
        useSearchGrounding: true,
      })
      expect(model).toBe('google-model')
    })
  })

  describe('streamAiText', () => {
    it('wraps streamText result with toUIMessageStreamResponse', async () => {
      const response = new Response('stream-body')
      const mockToUIMessageStreamResponse = jest.fn().mockReturnValue(response)
      mockStreamText.mockResolvedValue({
        textStream: 'text-stream',
        toUIMessageStreamResponse: mockToUIMessageStreamResponse,
      } as any)

      const result = await streamAiText({
        model: 'gpt-4o-mini',
        registry: mockRegistry as any,
        service: 'openai',
        messages: testMessages,
        temperature: 0.2,
        maxTokens: 150,
        options: {},
      })

      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mock-model',
        messages: testMessages,
        temperature: 0.2,
        maxOutputTokens: 150,
      })
      expect(mockToUIMessageStreamResponse).toHaveBeenCalled()
      expect(result).toBe(response)
    })

    it('passes providerOptions to streamText when provided', async () => {
      const response = new Response('stream-body')
      const mockToUIMessageStreamResponse = jest.fn().mockReturnValue(response)
      mockStreamText.mockResolvedValue({
        textStream: 'text-stream',
        toUIMessageStreamResponse: mockToUIMessageStreamResponse,
      } as any)

      const providerOptions = { openai: { reasoningEffort: 'high' } }

      await streamAiText({
        model: 'gpt-5',
        registry: mockRegistry as any,
        service: 'openai',
        messages: testMessages,
        temperature: 0.2,
        maxTokens: 150,
        options: {},
        providerOptions,
      })

      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mock-model',
        messages: testMessages,
        temperature: 0.2,
        maxOutputTokens: 150,
        providerOptions: { openai: { reasoningEffort: 'high' } },
      })
    })

    it('does not include providerOptions when undefined', async () => {
      const response = new Response('stream-body')
      const mockToUIMessageStreamResponse = jest.fn().mockReturnValue(response)
      mockStreamText.mockResolvedValue({
        textStream: 'text-stream',
        toUIMessageStreamResponse: mockToUIMessageStreamResponse,
      } as any)

      await streamAiText({
        model: 'gpt-4o-mini',
        registry: mockRegistry as any,
        service: 'openai',
        messages: testMessages,
        temperature: 0.2,
        maxTokens: 150,
        options: {},
      })

      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'mock-model',
        messages: testMessages,
        temperature: 0.2,
        maxOutputTokens: 150,
      })
    })

    it('returns a 500 response when streaming fails', async () => {
      mockStreamText.mockRejectedValue(new Error('network down'))

      const errorResponse = await streamAiText({
        model: 'gpt-4o-mini',
        registry: mockRegistry as any,
        service: 'openai',
        messages: testMessages,
        temperature: 0.5,
        maxTokens: 200,
      })

      expect(errorResponse.status).toBe(500)
      expect(await errorResponse.json()).toEqual({
        error: 'AI Service Error: network down',
        errorCode: 'AIServiceError',
      })
    })
  })

  describe('generateAiText', () => {
    it('returns JSON payload with text', async () => {
      mockGenerateText.mockResolvedValue({ text: 'final text' } as any)

      const response = await generateAiText({
        model: 'gpt-4.1',
        registry: mockRegistry as any,
        service: 'openai',
        messages: testMessages,
        temperature: 0.1,
        maxTokens: 100,
      })

      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'mock-model',
        messages: testMessages,
        temperature: 0.1,
        maxOutputTokens: 100,
      })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ text: 'final text' })
    })

    it('passes providerOptions to generateText when provided', async () => {
      mockGenerateText.mockResolvedValue({ text: 'reasoning result' } as any)

      const providerOptions = {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 12000 },
          effort: 'high',
        },
      }

      await generateAiText({
        model: 'claude-sonnet-4-5',
        registry: mockRegistry as any,
        service: 'anthropic' as any,
        messages: testMessages,
        temperature: 1.0,
        maxTokens: 4096,
        providerOptions,
      })

      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'mock-model',
        messages: testMessages,
        temperature: 1.0,
        maxOutputTokens: 4096,
        providerOptions: {
          anthropic: {
            thinking: { type: 'enabled', budgetTokens: 12000 },
            effort: 'high',
          },
        },
      })
    })

    it('returns error response when generation fails', async () => {
      mockGenerateText.mockRejectedValue(new Error('quota exceeded'))

      const response = await generateAiText({
        model: 'gpt-4.1',
        registry: mockRegistry as any,
        service: 'openai',
        messages: testMessages,
        temperature: 0.3,
        maxTokens: 256,
      })

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({
        error: 'AI Service Error: quota exceeded',
        errorCode: 'AIServiceError',
      })
    })
  })
})
