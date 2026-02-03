import { Message } from '@/features/messages/messages'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createXai } from '@ai-sdk/xai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createCohere } from '@ai-sdk/cohere'
import { createMistral } from '@ai-sdk/mistral'
import { createAzure } from '@ai-sdk/azure'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createPerplexity } from '@ai-sdk/perplexity'
import { createFireworks } from '@ai-sdk/fireworks'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createOllama } from 'ollama-ai-provider'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import {
  streamText,
  generateText,
  ModelMessage,
  createProviderRegistry,
  LanguageModel,
} from 'ai'
import { VercelAIService } from '@/features/constants/settings'

/**
 * プロバイダー作成に必要なパラメータ
 */
export type ProviderParams = {
  apiKey?: string
  baseURL?: string
  resourceName?: string
}

type AIRegistry = ReturnType<typeof createProviderRegistry<Record<string, any>>>

/**
 * 指定されたAIサービス用のProvider Registryを作成する
 */
export function createAIRegistry(
  service: VercelAIService,
  params: ProviderParams
): AIRegistry | null {
  const providers: Record<string, any> = {}

  switch (service) {
    case 'openai':
      providers.openai = createOpenAI({ apiKey: params.apiKey })
      break
    case 'anthropic':
      providers.anthropic = createAnthropic({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'google':
      providers.google = createGoogleGenerativeAI({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'azure':
      providers.azure = createAzure({
        resourceName: params.resourceName,
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'xai':
      providers.xai = createXai({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'groq':
      providers.groq = createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: params.apiKey,
      })
      break
    case 'cohere':
      providers.cohere = createCohere({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'mistralai':
      providers.mistralai = createMistral({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'perplexity':
      providers.perplexity = createPerplexity({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'fireworks':
      providers.fireworks = createFireworks({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'deepseek':
      providers.deepseek = createDeepSeek({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'openrouter':
      providers.openrouter = createOpenRouter({
        apiKey: params.apiKey,
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'lmstudio':
      providers.lmstudio = createOpenAICompatible({
        name: 'lmstudio',
        baseURL: params.baseURL ?? '',
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'ollama':
      providers.ollama = createOllama({
        baseURL: params.baseURL ?? '',
      }) as unknown as ReturnType<typeof createOpenAI>
      break
    case 'custom-api':
      // custom-apiは別途処理されるため、ここでは空
      return null
  }

  return createProviderRegistry(providers)
}

/**
 * Registryからモデルを取得する
 */
export function getLanguageModel(
  registry: AIRegistry,
  service: VercelAIService,
  model: string,
  options?: Record<string, unknown>
): LanguageModel {
  const modelId = `${service}:${model}`

  if (options && Object.keys(options).length > 0) {
    // オプションがある場合（例：Google Search Grounding）
    // registryから直接プロバイダーを取得してオプション付きでモデルを作成
    const provider = (registry as unknown as Record<string, CallableFunction>)[
      service
    ]
    if (provider) {
      return provider(model, options) as LanguageModel
    }
  }

  return registry.languageModel(modelId as `${string}:${string}`)
}

/**
 * ストリーミングでテキスト生成を行う
 */
export async function streamAiText({
  model,
  registry,
  service,
  messages,
  temperature,
  maxTokens,
  options = {},
  providerOptions,
}: {
  model: string
  registry: AIRegistry
  service: VercelAIService
  messages: Message[]
  temperature: number
  maxTokens: number
  options?: Record<string, unknown>
  providerOptions?: Record<string, Record<string, unknown>>
}) {
  try {
    const languageModel = getLanguageModel(registry, service, model, options)

    const result = await streamText({
      model: languageModel,
      messages: messages as ModelMessage[],
      temperature,
      maxOutputTokens: maxTokens,
      ...(providerOptions && {
        providerOptions: providerOptions as Parameters<
          typeof streamText
        >[0]['providerOptions'],
      }),
    })

    return result.toUIMessageStreamResponse()
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`Vercel AI Stream Error: ${errorMessage}`)
    console.error(`Model: ${model}, Temperature: ${temperature}`)

    return new Response(
      JSON.stringify({
        error: `AI Service Error: ${errorMessage}`,
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
  registry,
  service,
  messages,
  temperature,
  maxTokens,
  providerOptions,
}: {
  model: string
  registry: AIRegistry
  service: VercelAIService
  messages: Message[]
  temperature: number
  maxTokens: number
  providerOptions?: Record<string, Record<string, unknown>>
}) {
  try {
    const languageModel = getLanguageModel(registry, service, model)

    const result = await generateText({
      model: languageModel,
      messages: messages as ModelMessage[],
      temperature,
      maxOutputTokens: maxTokens,
      ...(providerOptions && {
        providerOptions: providerOptions as Parameters<
          typeof generateText
        >[0]['providerOptions'],
      }),
    })

    return new Response(JSON.stringify({ text: result.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error(`Vercel AI Generate Error: ${errorMessage}`)
    console.error(`Model: ${model}, Temperature: ${temperature}`)

    return new Response(
      JSON.stringify({
        error: `AI Service Error: ${errorMessage}`,
        errorCode: 'AIServiceError',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
