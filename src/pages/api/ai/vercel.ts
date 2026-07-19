import { logger } from '@/lib/logger'
import { Message } from '@/features/messages/messages'
import { NextApiRequest, NextApiResponse } from 'next'
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
import {
  mergeProviderOptions,
  preparePromptCache,
} from '@/lib/api-services/promptCache'
import { googleSearchGroundingModels } from '@/features/constants/aiModels'
import { pipeResponse } from '@/utils/pipeResponse'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import type { PolicyGate } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  gate: PolicyGate
) {
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
  } = req.body

  // APIキーの取得と検証
  let aiApiKey = apiKey
  let usesServerSecret = false
  if (isVercelCloudAIService(aiService)) {
    if (!aiApiKey) {
      // 環境変数から[サービス名]_KEY または [サービス名]_API_KEY の形式でAPIキーを取得
      const servicePrefix = aiService.toUpperCase()
      aiApiKey =
        process.env[`${servicePrefix}_KEY`] ||
        process.env[`${servicePrefix}_API_KEY`] ||
        ''
      usesServerSecret = Boolean(aiApiKey)
    }
    if (!aiApiKey) {
      return res
        .status(400)
        .json({ error: 'Empty API Key', errorCode: 'EmptyAPIKey' })
    }
  }

  if (!gate.guardServerSecret(usesServerSecret)) {
    return
  }

  // ローカルLLMのURL検証
  if (isVercelLocalAIService(aiService) && aiService !== 'custom-api') {
    if (!localLlmUrl) {
      return res.status(400).json({
        error: 'Empty Local LLM URL',
        errorCode: 'EmptyLocalLLMURL',
      })
    }
  }

  // Azureのエンドポイントとデプロイメント名の処理
  const azureEndpointValue =
    aiService === 'azure'
      ? azureEndpoint || process.env.AZURE_ENDPOINT || ''
      : ''
  const usesServerAzureEndpoint =
    aiService === 'azure' &&
    !azureEndpoint &&
    Boolean(process.env.AZURE_ENDPOINT)
  if (!gate.guardServerSecret(usesServerAzureEndpoint)) {
    return
  }

  let modifiedAzureEndpoint = azureEndpointValue.replace(
    /^https:\/\/|\.openai\.azure\.com.*$/g,
    ''
  )
  let modifiedAzureDeployment =
    azureEndpointValue.match(/\/deployments\/([^\/]+)/)?.[1] || ''
  let modifiedModel = aiService === 'azure' ? modifiedAzureDeployment : model

  // モデル名のバリデーション
  if (isVercelCloudAIService(aiService) && !modifiedModel) {
    return res.status(400).json({
      error: 'Invalid AI service or model',
      errorCode: 'AIInvalidProperty',
    })
  }

  try {
    // Provider Registryの作成
    const registry = createAIRegistry(aiService as VercelAIService, {
      apiKey: aiApiKey,
      baseURL: localLlmUrl,
      resourceName: modifiedAzureEndpoint,
    })

    if (!registry) {
      return res.status(400).json({
        error: 'Invalid AI service',
        errorCode: 'InvalidAIService',
      })
    }

    // メッセージの修正
    const modifiedMessages = modifyMessages(aiService, model, messages)
    const promptCache = preparePromptCache(
      aiService,
      modifiedModel,
      modifiedMessages
    )

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

    // 推論モードのproviderOptionsを構築
    const providerOptions = mergeProviderOptions(
      buildReasoningProviderOptions(
        aiService,
        modifiedModel,
        reasoningMode,
        reasoningEffort,
        reasoningTokenBudget
      ),
      promptCache.providerOptions
    )

    // ストリーミングレスポンスまたは一括レスポンスの生成
    let response: Response
    if (stream) {
      response = await streamAiText({
        model: modifiedModel,
        registry,
        service: aiService as VercelAIService,
        messages: promptCache.messages,
        temperature,
        maxTokens,
        options,
        providerOptions,
      })
    } else {
      response = await generateAiText({
        model: modifiedModel,
        registry,
        service: aiService as VercelAIService,
        messages: promptCache.messages,
        temperature,
        maxTokens,
        providerOptions,
      })
    }

    return pipeResponse(response, res)
  } catch (error) {
    logger.error('Error in AI API call:', error)

    return res.status(500).json({
      error: 'Unexpected Error',
      errorCode: 'AIAPIError',
    })
  }
}

export default withAccessPolicy(routePolicies['/api/ai/vercel'], handler)
