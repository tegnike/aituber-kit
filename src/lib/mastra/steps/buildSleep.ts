import { createStep } from '@mastra/core/workflows'
import { evaluateStateOutputSchema, workflowOutputSchema } from '../schemas'
import { getLastMessages, buildCharacterSystemMessage } from '../prompts'

/**
 * スリープメッセージ構築ステップ
 * noCommentCount>=6 の場合に実行される
 * AI呼び出しなし: スリープ用メッセージを構築
 */
export const buildSleepStep = createStep({
  id: 'build-sleep',
  inputSchema: evaluateStateOutputSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    const { chatLog, systemPrompt, newNoCommentCount } = inputData

    const lastTenMessages = getLastMessages(chatLog, 10)
    const systemMessage = buildCharacterSystemMessage(
      systemPrompt,
      '- あなたはYouTubeの配信者ですが、現在視聴者があまり来ていません。\n- 視聴者が来るまで別の作業をしている旨のセリフを生成してください。'
    )

    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...lastTenMessages,
    ]

    return {
      action: 'sleep' as const,
      messages,
      stateUpdates: {
        noCommentCount: newNoCommentCount,
        continuationCount: 0,
        sleepMode: true,
      },
    }
  },
})
