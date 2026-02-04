import { createStep } from '@mastra/core/workflows'
import { evaluateStateOutputSchema, workflowOutputSchema } from '../schemas'
import { getLastMessages, buildCharacterSystemMessage } from '../prompts'
import { DEFAULT_PROMPT_CONTINUATION } from '../defaultPrompts'

/**
 * コメント無し時の会話継続メッセージ構築ステップ
 * デフォルト: noCommentCount<3 or 4-5 の場合に実行される
 * AI呼び出しなし: 会話継続用メッセージを構築
 */
export const buildContinueNoCommentStep = createStep({
  id: 'build-continue-no-comment',
  inputSchema: evaluateStateOutputSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData }) => {
    const { chatLog, systemPrompt, newNoCommentCount, promptContinuation } =
      inputData

    const lastTenMessages = getLastMessages(chatLog, 10)
    const systemMessage = buildCharacterSystemMessage(
      systemPrompt,
      promptContinuation || DEFAULT_PROMPT_CONTINUATION
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
        continuationCount: 0,
        sleepMode: false,
      },
    }
  },
})
