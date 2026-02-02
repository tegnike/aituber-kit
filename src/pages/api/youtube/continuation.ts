import type { NextApiRequest, NextApiResponse } from 'next'
import {
  VercelAIService,
  isVercelCloudAIService,
  isVercelLocalAIService,
} from '@/features/constants/settings'
import { createAIRegistry, getLanguageModel } from '@/lib/api-services/vercelAi'
import { mastra } from '@/lib/mastra'
import { RequestContext } from '@mastra/core/request-context'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const {
    aiService,
    model,
    apiKey,
    localLlmUrl,
    azureEndpoint,
    temperature = 1.0,
    maxTokens = 4096,
    chatLog,
    systemPrompt,
    youtubeComments,
    noCommentCount,
    continuationCount,
    sleepMode,
    newTopicThreshold = 3,
    sleepThreshold = 6,
    promptEvaluate = '',
    promptContinuation = '',
    promptSelectComment = '',
    promptNewTopic = '',
    promptSleep = '',
  } = req.body

  // APIキーの取得と検証
  let aiApiKey = apiKey
  if (isVercelCloudAIService(aiService)) {
    if (!aiApiKey) {
      const servicePrefix = aiService.toUpperCase()
      aiApiKey =
        process.env[`${servicePrefix}_KEY`] ||
        process.env[`${servicePrefix}_API_KEY`] ||
        ''
    }
    if (!aiApiKey) {
      return res
        .status(400)
        .json({ error: 'Empty API Key', errorCode: 'EmptyAPIKey' })
    }
  }

  // ローカルLLMのURL検証
  if (
    isVercelLocalAIService(aiService) &&
    aiService !== 'custom-api' &&
    !localLlmUrl
  ) {
    return res
      .status(400)
      .json({ error: 'Empty Local LLM URL', errorCode: 'EmptyLocalLLMURL' })
  }

  // Azureのエンドポイントとデプロイメント名の処理
  let modifiedAzureEndpoint = (
    azureEndpoint ||
    process.env.AZURE_ENDPOINT ||
    ''
  ).replace(/^https:\/\/|\.openai\.azure\.com.*$/g, '')
  const modifiedAzureDeployment =
    (azureEndpoint || process.env.AZURE_ENDPOINT || '').match(
      /\/deployments\/([^\/]+)/
    )?.[1] || ''
  const modifiedModel = aiService === 'azure' ? modifiedAzureDeployment : model

  if (aiService === 'azure' && !modifiedModel) {
    return res.status(400).json({
      error: 'Azure deployment name could not be extracted from endpoint',
      errorCode: 'EmptyAzureDeployment',
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

    // LanguageModelの取得
    const languageModel = getLanguageModel(
      registry,
      aiService as VercelAIService,
      modifiedModel
    )

    // Workflow取得・実行
    const workflow = mastra.getWorkflow('conversationWorkflow')
    const run = await workflow.createRun()
    const result = await run.start({
      inputData: {
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
      },
      requestContext: new RequestContext([
        ['languageModel', languageModel],
        ['temperature', temperature],
        ['maxTokens', maxTokens],
      ]),
    })

    if (result.status === 'success') {
      return res.status(200).json(result.result)
    } else {
      console.error('Workflow failed:', result)
      return res.status(500).json({
        error:
          result.status === 'failed'
            ? result.error?.message
            : 'Workflow did not complete successfully',
      })
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in youtube continuation API:', errorMessage)
    return res.status(500).json({ error: errorMessage })
  }
}
