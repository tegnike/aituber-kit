import { Message } from '@/features/messages/messages'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createCohere } from '@ai-sdk/cohere'
import { createMistral } from '@ai-sdk/mistral'
import { createAzure } from '@ai-sdk/azure'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOllama } from 'ollama-ai-provider'
import { streamText, generateText, CoreMessage } from 'ai'
import { VercelAIService } from '@/features/constants/settings'

type AIServiceConfig = Record<VercelAIService, (params: any) => any>

/**
 * Vercel AI SDKを使用したAIサービス設定
 */
export const aiServiceConfig: AIServiceConfig = {
  openai: ({ apiKey }) => createOpenAI({ apiKey }).responses,
  anthropic: ({ apiKey }) => createAnthropic({ apiKey }),
  google: ({ apiKey }) => createGoogleGenerativeAI({ apiKey }),
  azure: ({ resourceName, apiKey }) =>
    createAzure({
      resourceName,
      apiKey,
    }),
  groq: ({ apiKey }) =>
    createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey,
    }),
  cohere: ({ apiKey }) => createCohere({ apiKey }),
  mistralai: ({ apiKey }) => createMistral({ apiKey }),
  perplexity: ({ apiKey }) =>
    createOpenAI({ baseURL: 'https://api.perplexity.ai/', apiKey }),
  fireworks: ({ apiKey }) =>
    createOpenAI({
      baseURL: 'https://api.fireworks.ai/inference/v1',
      apiKey,
    }),
  deepseek: ({ apiKey }) => createDeepSeek({ apiKey }),
  lmstudio: ({ baseURL }) =>
    createOpenAICompatible({ name: 'lmstudio', baseURL }),
  ollama: ({ baseURL }) => createOllama({ baseURL }),
  'custom-api': () => null, // 特別な処理はせず、カスタムAPI用
}

/**
 * ストリーミングでテキスト生成を行う
 */
export async function streamAiText({
  model,
  modelInstance,
  messages,
  temperature,
  maxTokens,
  options = {},
}: {
  model: string
  modelInstance: any
  messages: Message[]
  temperature: number
  maxTokens: number
  options?: any
}) {
  try {
    const result = await streamText({
      model: modelInstance(model, options),
      messages: messages as CoreMessage[],
      temperature,
      maxTokens,
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error(`Vercel AI Stream Error: ${error.message || 'Unknown error'}`)
    console.error(`Model: ${model}, Temperature: ${temperature}`)

    return new Response(
      JSON.stringify({
        error: `AI Service Error: ${error.message || 'Unknown error'}`,
        errorCode: 'AIServiceError',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * 一括でテキスト生成を行う
 */
export async function generateAiText({
  model,
  modelInstance,
  messages,
  temperature,
  maxTokens,
}: {
  model: string
  modelInstance: any
  messages: Message[]
  temperature: number
  maxTokens: number
}) {
  try {
    const result = await generateText({
      model: modelInstance(model),
      messages: messages as CoreMessage[],
      temperature,
      maxTokens,
    })

    return new Response(JSON.stringify({ text: result.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(
      `Vercel AI Generate Error: ${error.message || 'Unknown error'}`
    )
    console.error(`Model: ${model}, Temperature: ${temperature}`)

    return new Response(
      JSON.stringify({
        error: `AI Service Error: ${error.message || 'Unknown error'}`,
        errorCode: 'AIServiceError',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
