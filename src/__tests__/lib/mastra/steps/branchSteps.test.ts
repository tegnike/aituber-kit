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
import {
  executeStep,
  buildEvaluateOutput,
} from '../../../helpers/mastraTestUtils'

const mockGenerateText = generateText as jest.MockedFunction<
  typeof generateText
>

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

      const result = await executeStep(buildContinuationStep, input)

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

      const result = await executeStep(buildContinuationStep, input)

      expect(result.messages![0].content).toContain('テスト用キャラクター設定')
    })

    it('uses custom promptContinuation when provided', async () => {
      const input = buildEvaluateOutput({
        promptContinuation: 'カスタム継続ガイドライン',
      })

      const result = await executeStep(buildContinuationStep, input)

      expect(result.messages![0].content).toContain('カスタム継続ガイドライン')
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

      const result = await executeStep(selectBestCommentStep, input)

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

      const result = await executeStep(selectBestCommentStep, input)

      expect(result.action).toBe('send_comment')
      expect(result.comment).toBe('いい天気だね')
      expect(result.userName).toBe('user1')
    })

    it('normalizes quoted AI responses before matching', async () => {
      mockGenerateText.mockResolvedValue({
        text: '「明日は雨？」',
      } as any)

      const input = buildEvaluateOutput({
        youtubeComments: [
          { userName: 'user1', userIconUrl: '', userComment: 'いい天気だね' },
          { userName: 'user2', userIconUrl: '', userComment: '明日は雨？' },
        ],
      })

      const result = await executeStep(selectBestCommentStep, input)

      expect(result.comment).toBe('明日は雨？')
      expect(result.userName).toBe('user2')
    })

    it('matches partially when AI response contains extra text', async () => {
      mockGenerateText.mockResolvedValue({
        text: '選択したコメント: 明日は雨？',
      } as any)

      const input = buildEvaluateOutput({
        youtubeComments: [
          { userName: 'user1', userIconUrl: '', userComment: 'いい天気だね' },
          { userName: 'user2', userIconUrl: '', userComment: '明日は雨？' },
        ],
      })

      const result = await executeStep(selectBestCommentStep, input)

      expect(result.comment).toBe('明日は雨？')
      expect(result.userName).toBe('user2')
    })

    it('passes custom promptSelectComment to the AI call', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'いい天気だね',
      } as any)

      const input = buildEvaluateOutput({
        youtubeComments: [
          { userName: 'user1', userIconUrl: '', userComment: 'いい天気だね' },
        ],
        promptSelectComment: 'カスタム選択プロンプト',
      })

      await executeStep(selectBestCommentStep, input)

      const callArgs = mockGenerateText.mock.calls[0][0] as any
      expect(callArgs.messages[0].role).toBe('system')
      expect(callArgs.messages[0].content).toContain('カスタム選択プロンプト')
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

      const result = await executeStep(generateNewTopicStep, input)

      expect(result.action).toBe('process_messages')
      expect(result.messages).toBeDefined()
      expect(result.messages![0].content).toContain('最近見た映画')
      expect(result.stateUpdates.noCommentCount).toBe(3)
      expect(result.stateUpdates.continuationCount).toBe(0)
    })

    it('passes custom promptNewTopic to the AI call', async () => {
      mockGenerateText.mockResolvedValue({
        text: '最近見た映画',
      } as any)

      const input = buildEvaluateOutput({
        newNoCommentCount: 3,
        promptNewTopic: 'カスタムトピック生成プロンプト',
      })

      await executeStep(generateNewTopicStep, input)

      const callArgs = mockGenerateText.mock.calls[0][0] as any
      expect(callArgs.messages[0].role).toBe('system')
      expect(callArgs.messages[0].content).toContain(
        'カスタムトピック生成プロンプト'
      )
    })

    it('instructs the character to switch to the generated topic', async () => {
      mockGenerateText.mockResolvedValue({
        text: '最近見た映画',
      } as any)

      const input = buildEvaluateOutput({ newNoCommentCount: 3 })

      const result = await executeStep(generateNewTopicStep, input)

      expect(result.messages![0].content).toContain(
        '話題を「最近見た映画」に切り替える'
      )
    })
  })

  describe('buildSleepStep', () => {
    it('has correct id', () => {
      expect(buildSleepStep.id).toBe('build-sleep')
    })

    it('returns sleep action with sleepMode=true', async () => {
      const input = buildEvaluateOutput({ newNoCommentCount: 6 })

      const result = await executeStep(buildSleepStep, input)

      expect(result.action).toBe('sleep')
      expect(result.messages).toBeDefined()
      expect(result.messages![0].content).toContain(
        '視聴者からのコメントがありません'
      )
      expect(result.stateUpdates.sleepMode).toBe(true)
      expect(result.stateUpdates.noCommentCount).toBe(6)
    })

    it('uses custom promptSleep when provided', async () => {
      const input = buildEvaluateOutput({
        newNoCommentCount: 6,
        promptSleep: 'カスタムスリープガイドライン',
      })

      const result = await executeStep(buildSleepStep, input)

      expect(result.messages![0].content).toContain(
        'カスタムスリープガイドライン'
      )
    })
  })

  describe('buildContinueNoCommentStep', () => {
    it('has correct id', () => {
      expect(buildContinueNoCommentStep.id).toBe('build-continue-no-comment')
    })

    it('returns process_messages action', async () => {
      const input = buildEvaluateOutput({ newNoCommentCount: 1 })

      const result = await executeStep(buildContinueNoCommentStep, input)

      expect(result.action).toBe('process_messages')
      expect(result.messages).toBeDefined()
      expect(result.stateUpdates.sleepMode).toBe(false)
      expect(result.stateUpdates.continuationCount).toBe(0)
      expect(result.stateUpdates.noCommentCount).toBe(1)
    })

    it('uses custom promptContinuation when provided', async () => {
      const input = buildEvaluateOutput({
        newNoCommentCount: 1,
        promptContinuation: 'カスタム継続ガイドライン',
      })

      const result = await executeStep(buildContinueNoCommentStep, input)

      expect(result.messages![0].content).toContain('カスタム継続ガイドライン')
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

      const result = await executeStep(buildDoNothingStep, input)

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

      const result = await executeStep(buildDoNothingStep, input)

      expect(result.action).toBe('do_nothing')
      expect(result.stateUpdates.noCommentCount).toBe(8)
    })
  })
})
