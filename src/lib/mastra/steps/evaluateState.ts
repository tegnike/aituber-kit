import { createStep } from '@mastra/core/workflows'
import { generateText } from 'ai'
import { workflowInputSchema, evaluateStateOutputSchema } from '../schemas'
import { getLastMessages, continuationCheckSystemPrompt } from '../prompts'

/**
 * Step 1: 状況評価
 * - sleepMode=false && continuationCount<1 の場合、AI呼び出しで継続チェック
 * - コメントの有無を判定
 * - noCommentCount を更新計算
 */
export const evaluateStateStep = createStep({
  id: 'evaluate-state',
  inputSchema: workflowInputSchema,
  outputSchema: evaluateStateOutputSchema,
  execute: async ({ inputData, requestContext }) => {
    const {
      chatLog,
      systemPrompt,
      youtubeComments,
      noCommentCount,
      continuationCount,
      sleepMode,
      newTopicThreshold,
      sleepThreshold,
      promptEvaluate,
      promptContinuation,
      promptSelectComment,
      promptNewTopic,
      promptSleep,
    } = inputData

    let shouldContinue = false
    const hasComments = youtubeComments.length > 0

    // 継続チェック: sleepMode=false && continuationCount<1 の場合のみ
    if (!sleepMode && continuationCount < 1) {
      const lastTenMessages = getLastMessages(chatLog, 10)

      // assistantメッセージがない場合はスキップ
      const hasAssistant = lastTenMessages.some(
        (message) => message.role === 'assistant'
      )

      if (hasAssistant) {
        try {
          const { languageModel, temperature, maxTokens } =
            requestContext.all as {
              languageModel: any
              temperature?: number
              maxTokens?: number
            }

          const queryMessages = [
            {
              role: 'system' as const,
              content: continuationCheckSystemPrompt(
                promptEvaluate || undefined
              ),
            },
            ...lastTenMessages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: typeof m.content === 'string' ? m.content : '',
            })),
          ]

          const result = await generateText({
            model: languageModel,
            messages: queryMessages,
            temperature: temperature ?? 1.0,
            maxOutputTokens: maxTokens ?? 4096,
          })

          try {
            const responseJson = JSON.parse(result.text)
            shouldContinue = responseJson.answer?.toString() === 'true'
          } catch {
            console.error(
              'JSON.parseエラーが発生しました。response:',
              result.text
            )
            shouldContinue = false
          }
        } catch (error) {
          console.error('AI呼び出しエラー:', error)
          shouldContinue = false
        }
      }
    }

    // noCommentCount の更新計算
    let newNoCommentCount: number
    if (hasComments) {
      newNoCommentCount = 0
    } else if (shouldContinue) {
      // 継続する場合は既存のnoCommentCountを維持（最低1）
      newNoCommentCount = noCommentCount < 1 ? 1 : noCommentCount
    } else {
      newNoCommentCount = noCommentCount + 1
    }

    return {
      shouldContinue,
      hasComments,
      newNoCommentCount,
      chatLog,
      systemPrompt,
      youtubeComments,
      continuationCount,
      sleepMode,
      newTopicThreshold,
      sleepThreshold,
      promptContinuation,
      promptSelectComment,
      promptNewTopic,
      promptSleep,
    }
  },
})
