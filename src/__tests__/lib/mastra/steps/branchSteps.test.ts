import { generateText } from 'ai'

jest.mock('ai', () => ({
  generateText: jest.fn(),
}))

import { buildContinuationStep } from '@/lib/mastra/steps/buildContinuation'
import { selectBestCommentStep } from '@/lib/mastra/steps/selectBestComment'
import { generateNewTopicStep } from '@/lib/mastra/steps/generateNewTopic'
import { buildSleepStep } from '@/lib/mastra/steps/buildSleep'
import { buildContinueNoCommentStep } from '@/lib/mastra/steps/buildContinueNoComment'
import { buildDoNothingStep } from '@/lib/mastra/steps/buildDoNothing'

const mockGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>

const buildEvaluateOutput = (overrides: any = {}) => ({
  shouldContinue: false,
  hasComments: false,
  newNoCommentCount: 1,
  chatLog: [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi there' },
  ],
  systemPrompt: 'You are helpful.',
  youtubeComments: [],
  continuationCount: 0,
  sleepMode: false,
  ...overrides,
})

const mockRequestContext = {
  all: {
    languageModel: 'mock-model',
    temperature: 1.0,
    maxTokens: 4096,
  },
}

const baseExecuteParams = {
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
}

describe('branch steps', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buildContinuationStep', () => {
    it('has correct id', () => {
      expect(buildContinuationStep.id).toBe('build-continuation')
    })

    it('returns process_messages action with incremented continuationCount', async () => {
      const input = buildEvaluateOutput({ continuationCount: 0 })

      const result = await buildContinuationStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.action).toBe('process_messages')
      expect(result.messages).toBeDefined()
      expect(result.messages!.length).toBeGreaterThan(0)
      expect(result.messages![0].role).toBe('system')
      expect(result.stateUpdates.continuationCount).toBe(1)
      expect(result.stateUpdates.sleepMode).toBe(false)
    })

    it('includes system prompt in generated messages', async () => {
      const input = buildEvaluateOutput({
        systemPrompt: 'テスト用キャラクター設定',
      })

      const result = await buildContinuationStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.messages![0].content).toContain('テスト用キャラクター設定')
    })
  })

  describe('selectBestCommentStep', () => {
    it('has correct id', () => {
      expect(selectBestCommentStep.id).toBe('select-best-comment')
    })

    it('returns send_comment action with selected comment', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'いい天気だね',
      } as any)

      const input = buildEvaluateOutput({
        youtubeComments: [
          { userName: 'user1', userIconUrl: '', userComment: 'いい天気だね' },
          { userName: 'user2', userIconUrl: '', userComment: '明日は雨？' },
        ],
      })

      const result = await selectBestCommentStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.action).toBe('send_comment')
      expect(result.comment).toBe('いい天気だね')
      expect(result.userName).toBe('user1')
      expect(result.stateUpdates.noCommentCount).toBe(0)
      expect(result.stateUpdates.sleepMode).toBe(false)
    })

    it('falls back to first comment when AI response does not match', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'unknown comment',
      } as any)

      const input = buildEvaluateOutput({
        youtubeComments: [
          { userName: 'user1', userIconUrl: '', userComment: 'いい天気だね' },
        ],
      })

      const result = await selectBestCommentStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.action).toBe('send_comment')
      expect(result.comment).toBe('いい天気だね')
      expect(result.userName).toBe('user1')
    })
  })

  describe('generateNewTopicStep', () => {
    it('has correct id', () => {
      expect(generateNewTopicStep.id).toBe('generate-new-topic')
    })

    it('generates a new topic and returns process_messages', async () => {
      mockGenerateText.mockResolvedValue({
        text: '最近見た映画',
      } as any)

      const input = buildEvaluateOutput({ newNoCommentCount: 3 })

      const result = await generateNewTopicStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.action).toBe('process_messages')
      expect(result.messages).toBeDefined()
      expect(result.messages![0].content).toContain('最近見た映画')
      expect(result.stateUpdates.noCommentCount).toBe(3)
      expect(result.stateUpdates.continuationCount).toBe(0)
    })
  })

  describe('buildSleepStep', () => {
    it('has correct id', () => {
      expect(buildSleepStep.id).toBe('build-sleep')
    })

    it('returns sleep action with sleepMode=true', async () => {
      const input = buildEvaluateOutput({ newNoCommentCount: 6 })

      const result = await buildSleepStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.action).toBe('sleep')
      expect(result.messages).toBeDefined()
      expect(result.messages![0].content).toContain(
        '視聴者からのコメントがありません'
      )
      expect(result.stateUpdates.sleepMode).toBe(true)
      expect(result.stateUpdates.noCommentCount).toBe(6)
    })
  })

  describe('buildContinueNoCommentStep', () => {
    it('has correct id', () => {
      expect(buildContinueNoCommentStep.id).toBe('build-continue-no-comment')
    })

    it('returns process_messages action', async () => {
      const input = buildEvaluateOutput({ newNoCommentCount: 1 })

      const result = await buildContinueNoCommentStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.action).toBe('process_messages')
      expect(result.messages).toBeDefined()
      expect(result.stateUpdates.sleepMode).toBe(false)
      expect(result.stateUpdates.continuationCount).toBe(0)
      expect(result.stateUpdates.noCommentCount).toBe(1)
    })
  })

  describe('buildDoNothingStep', () => {
    it('has correct id', () => {
      expect(buildDoNothingStep.id).toBe('build-do-nothing')
    })

    it('returns do_nothing action preserving sleepMode', async () => {
      const input = buildEvaluateOutput({
        newNoCommentCount: 7,
        sleepMode: true,
      })

      const result = await buildDoNothingStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.action).toBe('do_nothing')
      expect(result.stateUpdates.noCommentCount).toBe(7)
      expect(result.stateUpdates.sleepMode).toBe(true)
      expect(result.stateUpdates.continuationCount).toBe(0)
    })

    it('handles noCommentCount=8 correctly', async () => {
      const input = buildEvaluateOutput({
        newNoCommentCount: 8,
        sleepMode: true,
      })

      const result = await buildDoNothingStep.execute({
        inputData: input,
        ...baseExecuteParams,
      } as any)

      expect(result.action).toBe('do_nothing')
      expect(result.stateUpdates.noCommentCount).toBe(8)
    })
  })
})
