import { Message } from '@/features/messages/messages'
import { NextRequest } from 'next/server'
import {
  VercelAIService,
  isVercelCloudAIService,
  isVercelLocalAIService,
} from '@/features/constants/settings'
import { modifyMessages } from '../services/utils'
import {
  aiServiceConfig,
  streamAiText,
  generateAiText,
} from '../services/vercelAi'

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
    temperature = 1.0,
    maxTokens = 4096,
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

  // AIサービスのインスタンス作成
  const getServiceInstance = aiServiceConfig[aiService as VercelAIService]
  if (!getServiceInstance) {
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

  try {
    // AIサービスに適したパラメータを生成
    const serviceParams =
      aiService === 'azure'
        ? { resourceName: modifiedAzureEndpoint, apiKey: aiApiKey }
        : isVercelLocalAIService(aiService)
          ? { baseURL: localLlmUrl }
          : { apiKey: aiApiKey }

    // モデルインスタンスの作成
    const modelInstance = getServiceInstance(serviceParams)

    // メッセージの修正
    const modifiedMessages = modifyMessages(aiService, model, messages)

    // Google検索接地オプションの設定
    const isUseSearchGrounding =
      aiService === 'google' &&
      useSearchGrounding &&
      modifiedMessages.every((msg) => typeof msg.content === 'string')
    const options = isUseSearchGrounding ? { useSearchGrounding: true } : {}
    console.log('options', options)

    // ストリーミングレスポンスまたは一括レスポンスの生成
    if (stream) {
      return await streamAiText({
        model: modifiedModel,
        modelInstance,
        messages: modifiedMessages,
        temperature,
        maxTokens,
        options,
      })
    } else {
      return await generateAiText({
        model: modifiedModel,
        modelInstance,
        messages: modifiedMessages,
        temperature,
        maxTokens,
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
