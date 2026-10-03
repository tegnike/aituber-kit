import { generateText } from 'ai'

jest.mock('ai', () => ({
  generateText: jest.fn(),
}))

// Import after mock
import { evaluateStateStep } from '@/lib/mastra/steps/evaluateState'
import {
  executeStep,
  buildWorkflowInput as buildInput,
} from '../../../helpers/mastraTestUtils'

const mockGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>

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

    const result = await executeStep(evaluateStateStep, input)

    expect(result.hasComments).toBe(true)
    expect(result.newNoCommentCount).toBe(0)
  })

  it('increments noCommentCount when no comments and no continuation', async () => {
    mockGenerateText.mockResolvedValue({
      text: '{"answer": "false", "reason": "区切りがついた"}',
    } as any)

    const input = buildInput({ noCommentCount: 2 })

    const result = await executeStep(evaluateStateStep, input)

    expect(result.shouldContinue).toBe(false)
    expect(result.newNoCommentCount).toBe(3)
  })

  it('sets shouldContinue=true when AI says to continue', async () => {
    mockGenerateText.mockResolvedValue({
      text: '{"answer": "true", "reason": "会話が続いている"}',
    } as any)

    const input = buildInput()

    const result = await executeStep(evaluateStateStep, input)

    expect(result.shouldContinue).toBe(true)
    expect(result.newNoCommentCount).toBe(1) // minimum 1
  })

  it('skips continuation check in sleep mode', async () => {
    const input = buildInput({ sleepMode: true })

    const result = await executeStep(evaluateStateStep, input)

    expect(result.shouldContinue).toBe(false)
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('skips continuation check when continuationCount >= 1', async () => {
    const input = buildInput({ continuationCount: 1 })

    const result = await executeStep(evaluateStateStep, input)

    expect(result.shouldContinue).toBe(false)
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('handles JSON parse errors gracefully', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'invalid json response',
    } as any)

    const input = buildInput()

    const result = await executeStep(evaluateStateStep, input)

    expect(result.shouldContinue).toBe(false)
  })

  it('handles AI call errors gracefully', async () => {
    mockGenerateText.mockRejectedValue(new Error('API error'))

    const input = buildInput()

    const result = await executeStep(evaluateStateStep, input)

    expect(result.shouldContinue).toBe(false)
    expect(result.newNoCommentCount).toBe(1)
  })

  it('passes through input data', async () => {
    const input = buildInput({ noCommentCount: 5 })

    const result = await executeStep(evaluateStateStep, input)

    expect(result.chatLog).toEqual(input.chatLog)
    expect(result.systemPrompt).toBe(input.systemPrompt)
    expect(result.youtubeComments).toEqual(input.youtubeComments)
    expect(result.continuationCount).toBe(input.continuationCount)
    expect(result.sleepMode).toBe(input.sleepMode)
  })

  it('skips continuation check when chatLog has no assistant message', async () => {
    const input = buildInput({
      chatLog: [{ role: 'user', content: 'hello' }],
    })

    const result = await executeStep(evaluateStateStep, input)

    expect(mockGenerateText).not.toHaveBeenCalled()
    expect(result.shouldContinue).toBe(false)
    expect(result.newNoCommentCount).toBe(1)
  })

  it('uses custom promptEvaluate as system prompt when provided', async () => {
    mockGenerateText.mockResolvedValue({
      text: '{"answer": "false", "reason": "区切りがついた"}',
    } as any)

    const input = buildInput({ promptEvaluate: 'カスタム評価プロンプト' })

    await executeStep(evaluateStateStep, input)

    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          { role: 'system', content: 'カスタム評価プロンプト' },
        ]),
      })
    )
  })

  it('passes through prompt overrides to output', async () => {
    const input = buildInput({
      sleepMode: true, // AI呼び出しをスキップ
      promptContinuation: '継続プロンプト',
      promptSelectComment: '選択プロンプト',
      promptNewTopic: 'トピックプロンプト',
      promptSleep: 'スリーププロンプト',
    })

    const result = await executeStep(evaluateStateStep, input)

    expect(result.promptContinuation).toBe('継続プロンプト')
    expect(result.promptSelectComment).toBe('選択プロンプト')
    expect(result.promptNewTopic).toBe('トピックプロンプト')
    expect(result.promptSleep).toBe('スリーププロンプト')
  })
})
