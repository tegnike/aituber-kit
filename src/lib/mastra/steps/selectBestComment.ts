import { createStep } from '@mastra/core/workflows'
import { generateText } from 'ai'
import { evaluateStateOutputSchema, workflowOutputSchema } from '../schemas'
import { buildBestCommentSelectionMessages } from '../prompts'

/**
 * ベストコメント選択ステップ
 * hasComments=true の場合に実行される
 * AI呼び出しあり: ベストコメントを選択
 */
export const selectBestCommentStep = createStep({
  id: 'select-best-comment',
  inputSchema: evaluateStateOutputSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData, requestContext }) => {
    const { chatLog, youtubeComments } = inputData

    const { languageModel, temperature, maxTokens } =
      requestContext as unknown as {
        languageModel: any
        temperature?: number
        maxTokens?: number
      }

    const queryMessages = buildBestCommentSelectionMessages(
      chatLog,
      youtubeComments
    ).map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : '',
    }))

    const result = await generateText({
      model: languageModel,
      messages: queryMessages,
      temperature: temperature ?? 1.0,
      maxOutputTokens: maxTokens ?? 4096,
    })

    const selectedText = result.text.trim()
    const matchedComment = youtubeComments.find(
      (c) => c.userComment === selectedText
    )

    return {
      action: 'send_comment' as const,
      comment: selectedText,
      userName: matchedComment?.userName || '',
      stateUpdates: {
        noCommentCount: 0,
        continuationCount: 0,
        sleepMode: false,
      },
    }
  },
})
