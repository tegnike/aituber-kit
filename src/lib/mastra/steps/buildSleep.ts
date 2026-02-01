import { createStep } from '@mastra/core/workflows'
import { evaluateStateOutputSchema, workflowOutputSchema } from '../schemas'
import { getLastMessages, buildCharacterSystemMessage } from '../prompts'
import { DEFAULT_PROMPT_SLEEP } from '../defaultPrompts'

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
    const { chatLog, systemPrompt, newNoCommentCount, promptSleep } = inputData

    const lastTenMessages = getLastMessages(chatLog, 10)
    const systemMessage = buildCharacterSystemMessage(
      systemPrompt,
      promptSleep || DEFAULT_PROMPT_SLEEP
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
