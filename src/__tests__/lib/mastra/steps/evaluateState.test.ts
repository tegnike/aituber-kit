import { generateText } from 'ai'

jest.mock('ai', () => ({
  generateText: jest.fn(),
}))

// Import after mock
import { evaluateStateStep } from '@/lib/mastra/steps/evaluateState'

const mockGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>

const buildInput = (overrides: any = {}) => ({
  chatLog: [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi there' },
  ],
  systemPrompt: 'You are helpful.',
  youtubeComments: [],
  noCommentCount: 0,
  continuationCount: 0,
  sleepMode: false,
  newTopicThreshold: 3,
  sleepThreshold: 6,
  ...overrides,
})

const mockRequestContext = {
  all: {
    languageModel: 'mock-model',
    temperature: 1.0,
    maxTokens: 4096,
  },
}

describe('evaluateStateStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('has correct id and schemas', () => {
    expect(evaluateStateStep.id).toBe('evaluate-state')
    expect(evaluateStateStep.inputSchema).toBeDefined()
    expect(evaluateStateStep.outputSchema).toBeDefined()
  })

  it('detects when comments are present', async () => {
    const input = buildInput({
      youtubeComments: [
        { userName: 'user1', userIconUrl: '', userComment: 'こんにちは' },
      ],
    })

    const result = await evaluateStateStep.execute({
      inputData: input,
      requestContext: mockRequestContext,
      mastra: {} as any,
      runId: 'test-run',
      workflowId: 'test',
      resourceId: undefined,
      state: undefined,
      setState: jest.fn(),
      retryCount: 0,
      tracingContext: {} as any,
      getInitData: jest.fn(),
      getStepResult: jest.fn(),
      suspend: jest.fn() as any,
      bail: jest.fn() as any,
      abort: jest.fn(),
      engine: {} as any,
      abortSignal: new AbortController().signal,
      writer: {} as any,
    } as any)

    expect(result.hasComments).toBe(true)
    expect(result.newNoCommentCount).toBe(0)
  })

  it('increments noCommentCount when no comments and no continuation', async () => {
    mockGenerateText.mockResolvedValue({
      text: '{"answer": "false", "reason": "区切りがついた"}',
    } as any)

    const input = buildInput({ noCommentCount: 2 })

    const result = await evaluateStateStep.execute({
      inputData: input,
      requestContext: mockRequestContext,
      mastra: {} as any,
      runId: 'test-run',
      workflowId: 'test',
      resourceId: undefined,
      state: undefined,
      setState: jest.fn(),
      retryCount: 0,
      tracingContext: {} as any,
      getInitData: jest.fn(),
      getStepResult: jest.fn(),
      suspend: jest.fn() as any,
      bail: jest.fn() as any,
      abort: jest.fn(),
      engine: {} as any,
      abortSignal: new AbortController().signal,
      writer: {} as any,
    } as any)

    expect(result.shouldContinue).toBe(false)
    expect(result.newNoCommentCount).toBe(3)
  })

  it('sets shouldContinue=true when AI says to continue', async () => {
    mockGenerateText.mockResolvedValue({
      text: '{"answer": "true", "reason": "会話が続いている"}',
    } as any)

    const input = buildInput()

    const result = await evaluateStateStep.execute({
      inputData: input,
      requestContext: mockRequestContext,
      mastra: {} as any,
      runId: 'test-run',
      workflowId: 'test',
      resourceId: undefined,
      state: undefined,
      setState: jest.fn(),
      retryCount: 0,
      tracingContext: {} as any,
      getInitData: jest.fn(),
      getStepResult: jest.fn(),
      suspend: jest.fn() as any,
      bail: jest.fn() as any,
      abort: jest.fn(),
      engine: {} as any,
      abortSignal: new AbortController().signal,
      writer: {} as any,
    } as any)

    expect(result.shouldContinue).toBe(true)
    expect(result.newNoCommentCount).toBe(1) // minimum 1
  })

  it('skips continuation check in sleep mode', async () => {
    const input = buildInput({ sleepMode: true })

    const result = await evaluateStateStep.execute({
      inputData: input,
      requestContext: mockRequestContext,
      mastra: {} as any,
      runId: 'test-run',
      workflowId: 'test',
      resourceId: undefined,
      state: undefined,
      setState: jest.fn(),
      retryCount: 0,
      tracingContext: {} as any,
      getInitData: jest.fn(),
      getStepResult: jest.fn(),
      suspend: jest.fn() as any,
      bail: jest.fn() as any,
      abort: jest.fn(),
      engine: {} as any,
      abortSignal: new AbortController().signal,
      writer: {} as any,
    } as any)

    expect(result.shouldContinue).toBe(false)
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('skips continuation check when continuationCount >= 1', async () => {
    const input = buildInput({ continuationCount: 1 })

    const result = await evaluateStateStep.execute({
      inputData: input,
      requestContext: mockRequestContext,
      mastra: {} as any,
      runId: 'test-run',
      workflowId: 'test',
      resourceId: undefined,
      state: undefined,
      setState: jest.fn(),
      retryCount: 0,
      tracingContext: {} as any,
      getInitData: jest.fn(),
      getStepResult: jest.fn(),
      suspend: jest.fn() as any,
      bail: jest.fn() as any,
      abort: jest.fn(),
      engine: {} as any,
      abortSignal: new AbortController().signal,
      writer: {} as any,
    } as any)

    expect(result.shouldContinue).toBe(false)
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('handles JSON parse errors gracefully', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'invalid json response',
    } as any)

    const input = buildInput()

    const result = await evaluateStateStep.execute({
      inputData: input,
      requestContext: mockRequestContext,
      mastra: {} as any,
      runId: 'test-run',
      workflowId: 'test',
      resourceId: undefined,
      state: undefined,
      setState: jest.fn(),
      retryCount: 0,
      tracingContext: {} as any,
      getInitData: jest.fn(),
      getStepResult: jest.fn(),
      suspend: jest.fn() as any,
      bail: jest.fn() as any,
      abort: jest.fn(),
      engine: {} as any,
      abortSignal: new AbortController().signal,
      writer: {} as any,
    } as any)

    expect(result.shouldContinue).toBe(false)
  })

  it('handles AI call errors gracefully', async () => {
    mockGenerateText.mockRejectedValue(new Error('API error'))

    const input = buildInput()

    const result = await evaluateStateStep.execute({
      inputData: input,
      requestContext: mockRequestContext,
      mastra: {} as any,
      runId: 'test-run',
      workflowId: 'test',
      resourceId: undefined,
      state: undefined,
      setState: jest.fn(),
      retryCount: 0,
      tracingContext: {} as any,
      getInitData: jest.fn(),
      getStepResult: jest.fn(),
      suspend: jest.fn() as any,
      bail: jest.fn() as any,
      abort: jest.fn(),
      engine: {} as any,
      abortSignal: new AbortController().signal,
      writer: {} as any,
    } as any)

    expect(result.shouldContinue).toBe(false)
    expect(result.newNoCommentCount).toBe(1)
  })

  it('passes through input data', async () => {
    const input = buildInput({ noCommentCount: 5 })

    const result = await evaluateStateStep.execute({
      inputData: input,
      requestContext: mockRequestContext,
      mastra: {} as any,
      runId: 'test-run',
      workflowId: 'test',
      resourceId: undefined,
      state: undefined,
      setState: jest.fn(),
      retryCount: 0,
      tracingContext: {} as any,
      getInitData: jest.fn(),
      getStepResult: jest.fn(),
      suspend: jest.fn() as any,
      bail: jest.fn() as any,
      abort: jest.fn(),
      engine: {} as any,
      abortSignal: new AbortController().signal,
      writer: {} as any,
    } as any)

    expect(result.chatLog).toEqual(input.chatLog)
    expect(result.systemPrompt).toBe(input.systemPrompt)
    expect(result.youtubeComments).toEqual(input.youtubeComments)
    expect(result.continuationCount).toBe(input.continuationCount)
    expect(result.sleepMode).toBe(input.sleepMode)
  })
})
