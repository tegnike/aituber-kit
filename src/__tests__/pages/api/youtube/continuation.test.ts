import handler from '@/pages/api/youtube/continuation'
import { createAIRegistry, getLanguageModel } from '@/lib/api-services/vercelAi'
import { RequestContext } from '@mastra/core/request-context'
import { createMocks } from 'node-mocks-http'

// Mastra workflow mock
const mockStart = jest.fn()
const mockCreateRun = jest.fn().mockResolvedValue({ start: mockStart })
const mockGetWorkflow = jest.fn().mockReturnValue({ createRun: mockCreateRun })

jest.mock('@/lib/api-services/vercelAi', () => ({
  createAIRegistry: jest.fn(),
  getLanguageModel: jest.fn(),
}))

jest.mock('@/lib/mastra', () => ({
  mastra: {
    getWorkflow: (...args: any[]) => mockGetWorkflow(...args),
  },
}))

const mockCreateAIRegistry = createAIRegistry as jest.MockedFunction<
  typeof createAIRegistry
>
const mockGetLanguageModel = getLanguageModel as jest.MockedFunction<
  typeof getLanguageModel
>

const buildRequestBody = (overrides: any = {}) => ({
  aiService: 'openai',
  model: 'gpt-4o',
  apiKey: 'test-key',
  localLlmUrl: '',
  azureEndpoint: '',
  temperature: 1.0,
  maxTokens: 4096,
  chatLog: [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi there' },
  ],
  systemPrompt: 'You are a helpful assistant.',
  youtubeComments: [],
  noCommentCount: 0,
  continuationCount: 0,
  sleepMode: false,
  ...overrides,
})

describe('/api/youtube/continuation handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateAIRegistry.mockReturnValue({ languageModel: jest.fn() } as any)
    mockGetLanguageModel.mockReturnValue('mock-language-model' as any)
  })

  it('rejects non-POST requests', async () => {
    const { req, res } = createMocks({ method: 'GET' })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Method Not Allowed',
    })
  })

  it('returns 400 when API key is missing for cloud providers', async () => {
    const originalEnv = { ...process.env }
    delete process.env.OPENAI_KEY
    delete process.env.OPENAI_API_KEY

    const { req, res } = createMocks({
      method: 'POST',
      body: buildRequestBody({ apiKey: '' }),
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })

    Object.keys(process.env).forEach((key) => delete process.env[key])
    Object.assign(process.env, originalEnv)
  })

  it('returns 400 when local LLM URL is missing', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: buildRequestBody({
        aiService: 'ollama',
        apiKey: '',
        localLlmUrl: '',
      }),
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Empty Local LLM URL',
      errorCode: 'EmptyLocalLLMURL',
    })
  })

  it('returns 400 when registry creation fails', async () => {
    mockCreateAIRegistry.mockReturnValue(null)

    const { req, res } = createMocks({
      method: 'POST',
      body: buildRequestBody(),
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Invalid AI service',
      errorCode: 'InvalidAIService',
    })
  })

  it('executes workflow and returns success result', async () => {
    const workflowResult = {
      status: 'success',
      result: {
        action: 'process_messages',
        messages: [{ role: 'system', content: 'test' }],
        stateUpdates: {
          noCommentCount: 1,
          continuationCount: 0,
          sleepMode: false,
        },
      },
    }
    mockStart.mockResolvedValue(workflowResult)

    const { req, res } = createMocks({
      method: 'POST',
      body: buildRequestBody(),
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.action).toBe('process_messages')
    expect(data.stateUpdates.noCommentCount).toBe(1)

    // Verify workflow was called correctly
    expect(mockGetWorkflow).toHaveBeenCalledWith('conversationWorkflow')
    expect(mockCreateRun).toHaveBeenCalled()
    expect(mockStart).toHaveBeenCalledWith(
      expect.objectContaining({
        inputData: expect.objectContaining({
          noCommentCount: 0,
          continuationCount: 0,
          sleepMode: false,
        }),
        requestContext: expect.any(RequestContext),
      })
    )

    // Verify requestContext contains correct values
    const callArgs = mockStart.mock.calls[0][0]
    const ctx = callArgs.requestContext as RequestContext
    expect(ctx.get('languageModel')).toBe('mock-language-model')
    expect(ctx.get('temperature')).toBe(1.0)
    expect(ctx.get('maxTokens')).toBe(4096)
  })

  it('returns send_comment action for comment selection', async () => {
    const workflowResult = {
      status: 'success',
      result: {
        action: 'send_comment',
        comment: 'いい天気だね',
        userName: 'user1',
        stateUpdates: {
          noCommentCount: 0,
          continuationCount: 0,
          sleepMode: false,
        },
      },
    }
    mockStart.mockResolvedValue(workflowResult)

    const { req, res } = createMocks({
      method: 'POST',
      body: buildRequestBody({
        youtubeComments: [
          {
            userComment: 'いい天気だね',
            userName: 'user1',
            userIconUrl: '',
          },
        ],
      }),
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.action).toBe('send_comment')
    expect(data.comment).toBe('いい天気だね')
    expect(data.userName).toBe('user1')
  })

  it('returns 500 when workflow fails', async () => {
    mockStart.mockResolvedValue({
      status: 'failed',
      error: new Error('Step execution failed'),
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: buildRequestBody(),
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Step execution failed')
  })

  it('returns 500 when an exception is thrown', async () => {
    mockCreateRun.mockRejectedValue(new Error('Unexpected error'))

    const { req, res } = createMocks({
      method: 'POST',
      body: buildRequestBody(),
    })

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(500)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('Unexpected error')
  })

  it('handles Azure deployment name extraction', async () => {
    mockStart.mockResolvedValue({
      status: 'success',
      result: {
        action: 'do_nothing',
        stateUpdates: {
          noCommentCount: 1,
          continuationCount: 0,
          sleepMode: false,
        },
      },
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: buildRequestBody({
        aiService: 'azure',
        apiKey: 'azure-key',
        azureEndpoint:
          'https://my-resource.openai.azure.com/openai/deployments/my-deploy/chat/completions',
      }),
    })

    await handler(req as any, res as any)

    expect(mockCreateAIRegistry).toHaveBeenCalledWith('azure', {
      apiKey: 'azure-key',
      baseURL: '',
      resourceName: 'my-resource',
    })
    expect(mockGetLanguageModel).toHaveBeenCalledWith(
      expect.anything(),
      'azure',
      'my-deploy'
    )
  })
})
