import { createStep } from '@mastra/core/workflows'
import { generateText } from 'ai'
import { evaluateStateOutputSchema, workflowOutputSchema } from '../schemas'
import {
  getLastMessages,
  buildCharacterSystemMessage,
  buildNewTopicGenerationMessages,
} from '../prompts'

/**
 * 新トピック生成ステップ
 * noCommentCount===3 の場合に実行される
 * AI呼び出しあり: 新トピックを生成し、そのトピックに基づくメッセージを構築
 */
export const generateNewTopicStep = createStep({
  id: 'generate-new-topic',
  inputSchema: evaluateStateOutputSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData, requestContext }) => {
    const { chatLog, systemPrompt, newNoCommentCount, promptNewTopic } =
      inputData

    const { languageModel, temperature, maxTokens } = requestContext.all as {
      languageModel: any
      temperature?: number
      maxTokens?: number
    }

    // Step 1: 新トピックを生成
    const topicMessages = buildNewTopicGenerationMessages(
      chatLog,
      promptNewTopic || undefined
    ).map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: typeof m.content === 'string' ? m.content : '',
    }))

    const topicResult = await generateText({
      model: languageModel,
      messages: topicMessages,
      temperature: temperature ?? 1.0,
      maxOutputTokens: maxTokens ?? 4096,
    })

    const topic = topicResult.text.trim()

    // Step 2: 新トピックに基づくメッセージを構築
    const lastTenMessages = getLastMessages(chatLog, 10)
    const systemMessage = buildCharacterSystemMessage(
      systemPrompt,
      `- 話題を「${topic}」に切り替える必要があります。話題を切り替える旨のセリフもコメントに含めてください。`
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
