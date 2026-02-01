import { createStep } from '@mastra/core/workflows'
import { evaluateStateOutputSchema, workflowOutputSchema } from '../schemas'
import { getLastMessages, buildCharacterSystemMessage } from '../prompts'

/**
 * 会話継続メッセージ構築ステップ
 * shouldContinue=true の場合に実行される
 * AI呼び出しなし: メッセージを構築して返すだけ
 */
export const buildContinuationStep = createStep({
  id: 'build-continuation',
  inputSchema: evaluateStateOutputSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    const { chatLog, systemPrompt, continuationCount, newNoCommentCount } =
      inputData

    const lastTenMessages = getLastMessages(chatLog, 10)
    const systemMessage = buildCharacterSystemMessage(
      systemPrompt,
      '- 与えられた会話歴に続く自然なコメントを生成してください。ただし、直前と同じ内容は避けてください。'
    )

    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...lastTenMessages,
    ]

    return {
      action: 'process_messages' as const,
      messages,
      stateUpdates: {
        noCommentCount: newNoCommentCount,
        continuationCount: continuationCount + 1,
        sleepMode: false,
      },
    }
  },
})
