import { streamAiText, generateAiText } from '@/lib/api-services/vercelAi'
import { Message } from '@/features/messages/messages'
import { streamText, generateText, createTextStreamResponse } from 'ai'

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
    createTextStreamResponse: jest.fn(),
  }
})

const mockStreamText = streamText as jest.MockedFunction<typeof streamText>
const mockGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>
const mockCreateTextStreamResponse =
  createTextStreamResponse as jest.MockedFunction<
    typeof createTextStreamResponse
  >

const testMessages: Message[] = [
  {
    role: 'user',
    content: 'hello',
    timestamp: '2024-01-01T00:00:00Z',
  },
]

describe('vercelAi service helpers', () => {
  const modelFactory = jest.fn().mockReturnValue('resolved-model')

  beforeEach(() => {
    jest.clearAllMocks()
    modelFactory.mockClear()
  })

  describe('streamAiText', () => {
    it('wraps streamText result with createTextStreamResponse', async () => {
      mockStreamText.mockResolvedValue({ textStream: 'text-stream' } as any)
      const response = new Response('stream-body')
      mockCreateTextStreamResponse.mockReturnValue(response)

      const result = await streamAiText({
        model: 'gpt-4o-mini',
        modelInstance: modelFactory,
        messages: testMessages,
        temperature: 0.2,
        maxTokens: 150,
        options: { experimental: true },
      })

      expect(modelFactory).toHaveBeenCalledWith('gpt-4o-mini', {
        experimental: true,
      })
      expect(mockStreamText).toHaveBeenCalledWith({
        model: 'resolved-model',
        messages: testMessages,
        temperature: 0.2,
        maxOutputTokens: 150,
      })
      expect(mockCreateTextStreamResponse).toHaveBeenCalledWith({
        textStream: 'text-stream',
      })
      expect(result).toBe(response)
    })

    it('returns a 500 response when streaming fails', async () => {
      mockStreamText.mockRejectedValue(new Error('network down'))

      const errorResponse = await streamAiText({
        model: 'gpt-4o-mini',
        modelInstance: modelFactory,
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
        modelInstance: modelFactory,
        messages: testMessages,
        temperature: 0.1,
        maxTokens: 100,
      })

      expect(modelFactory).toHaveBeenCalledWith('gpt-4.1')
      expect(mockGenerateText).toHaveBeenCalledWith({
        model: 'resolved-model',
        messages: testMessages,
        temperature: 0.1,
        maxOutputTokens: 100,
      })
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ text: 'final text' })
    })

    it('returns error response when generation fails', async () => {
      mockGenerateText.mockRejectedValue(new Error('quota exceeded'))

      const response = await generateAiText({
        model: 'gpt-4.1',
        modelInstance: modelFactory,
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
