import { Message } from '@/features/messages/messages'
import { NextRequest } from 'next/server'
import {
  VercelAIService,
  isVercelCloudAIService,
  isVercelLocalAIService,
} from '@/features/constants/settings'
import { modifyMessages } from '@/lib/api-services/utils'
import {
  createAIRegistry,
  streamAiText,
  generateAiText,
} from '@/lib/api-services/vercelAi'
import { buildReasoningProviderOptions } from '@/lib/api-services/providerOptionsBuilder'
import { googleSearchGroundingModels } from '@/features/constants/aiModels'
export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method Not Allowed',
        errorCode: 'METHOD_NOT_ALLOWED',
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const {
    messages,
    apiKey,
    aiService,
    model,
    localLlmUrl,
    azureEndpoint,
    stream,
    useSearchGrounding,
    dynamicRetrievalThreshold,
    temperature = 1.0,
    maxTokens = 4096,
    reasoningMode = false,
    reasoningEffort = 'medium',
    reasoningTokenBudget = 8192,
  } = await req.json()

  // APIキーの取得と検証
  let aiApiKey = apiKey
  if (isVercelCloudAIService(aiService)) {
    if (!aiApiKey) {
      // 環境変数から[サービス名]_KEY または [サービス名]_API_KEY の形式でAPIキーを取得
      const servicePrefix = aiService.toUpperCase()
      aiApiKey =
        process.env[`${servicePrefix}_KEY`] ||
        process.env[`${servicePrefix}_API_KEY`] ||
        ''
    }
    if (!aiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Empty API Key', errorCode: 'EmptyAPIKey' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  // ローカルLLMのURL検証
  if (isVercelLocalAIService(aiService) && aiService !== 'custom-api') {
    if (!localLlmUrl) {
      return new Response(
        JSON.stringify({
          error: 'Empty Local LLM URL',
          errorCode: 'EmptyLocalLLMURL',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }

  // Azureのエンドポイントとデプロイメント名の処理
  let modifiedAzureEndpoint = (
    azureEndpoint ||
    process.env.AZURE_ENDPOINT ||
    ''
  ).replace(/^https:\/\/|\.openai\.azure\.com.*$/g, '')
  let modifiedAzureDeployment =
    (azureEndpoint || process.env.AZURE_ENDPOINT || '').match(
      /\/deployments\/([^\/]+)/
    )?.[1] || ''
  let modifiedModel = aiService === 'azure' ? modifiedAzureDeployment : model

  // モデル名のバリデーション
  if (isVercelCloudAIService(aiService) && !modifiedModel) {
    return new Response(
      JSON.stringify({
        error: 'Invalid AI service or model',
        errorCode: 'AIInvalidProperty',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Provider Registryの作成
    const registry = createAIRegistry(aiService as VercelAIService, {
      apiKey: aiApiKey,
      baseURL: localLlmUrl,
      resourceName: modifiedAzureEndpoint,
    })

    if (!registry) {
      return new Response(
        JSON.stringify({
          error: 'Invalid AI service',
          errorCode: 'InvalidAIService',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // メッセージの修正
    const modifiedMessages = modifyMessages(aiService, model, messages)

    // Google検索接地オプションの設定
    const isUseSearchGrounding =
      aiService === 'google' &&
      useSearchGrounding &&
      modifiedMessages.every((msg) => typeof msg.content === 'string')

    let options: Record<string, unknown> = {}
    if (isUseSearchGrounding) {
      options = {
        useSearchGrounding: true,
        ...(dynamicRetrievalThreshold !== undefined &&
          modifiedModel &&
          googleSearchGroundingModels.includes(
            modifiedModel as (typeof googleSearchGroundingModels)[number]
          ) && {
            dynamicRetrievalConfig: {
              dynamicThreshold: dynamicRetrievalThreshold,
            },
          }),
      }
    }

    console.log('options', options)

    // 推論モードのproviderOptionsを構築
    const providerOptions = buildReasoningProviderOptions(
      aiService,
      modifiedModel,
      reasoningMode,
      reasoningEffort,
      reasoningTokenBudget
    )

    // ストリーミングレスポンスまたは一括レスポンスの生成
    if (stream) {
      return await streamAiText({
        model: modifiedModel,
        registry,
        service: aiService as VercelAIService,
        messages: modifiedMessages,
        temperature,
        maxTokens,
        options,
        providerOptions,
      })
    } else {
      return await generateAiText({
        model: modifiedModel,
        registry,
        service: aiService as VercelAIService,
        messages: modifiedMessages,
        temperature,
        maxTokens,
        providerOptions,
      })
    }
  } catch (error) {
    console.error('Error in AI API call:', error)

    return new Response(
      JSON.stringify({
        error: 'Unexpected Error',
        errorCode: 'AIAPIError',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
