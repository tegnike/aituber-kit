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
    const { chatLog, youtubeComments, promptSelectComment } = inputData

    const { languageModel, temperature, maxTokens } = requestContext.all as {
      languageModel: any
      temperature?: number
      maxTokens?: number
    }

    const queryMessages = buildBestCommentSelectionMessages(
      chatLog,
      youtubeComments,
      promptSelectComment || undefined
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

    // 段階的マッチング: 完全一致 → 部分一致 → フォールバック
    const normalizedSelected = selectedText
      .replace(/^["'「『（(]+/, '')
      .replace(/["'」』）)]+$/, '')
      .trim()

    let matchedComment = youtubeComments.find(
      (c) => c.userComment === normalizedSelected
    )
    if (!matchedComment) {
      matchedComment = youtubeComments.find(
        (c) =>
          normalizedSelected.includes(c.userComment) ||
          c.userComment.includes(normalizedSelected)
      )
    }
    if (!matchedComment && youtubeComments.length > 0) {
      matchedComment = youtubeComments[0]
    }

    return {
      action: 'send_comment' as const,
      comment: matchedComment?.userComment || selectedText,
      userName: matchedComment?.userName,
      stateUpdates: {
        noCommentCount: 0,
        continuationCount: 0,
        sleepMode: false,
      },
    }
  },
})
