import { Message } from '../messages/messages'
import i18next from 'i18next'
import toastStore from '@/features/stores/toast'
import {
  isVercelLocalAIService,
  AIService,
} from '@/features/constants/settings'
import settingsStore from '../stores/settings'

// 推論/思考チャンクを通常テキストと区別するためのマーカー
// null byteプレフィックスはLLMテキスト出力に現れないため安全
export const THINKING_MARKER = '\x00THINK:'

const getAIConfig = () => {
  const ss = settingsStore.getState()
  // AIServiceとして扱う（より広い型）
  const aiService = ss.selectAIService as AIService

  // APIキー名は条件分岐で取得
  const apiKey =
    typeof aiService === 'string' &&
    aiService !== 'dify' &&
    aiService !== 'custom-api'
      ? (ss[`${aiService}Key` as keyof typeof ss] as string)
      : ''

  return {
    aiApiKey: apiKey,
    selectAIService: aiService,
    selectAIModel: ss.selectAIModel,
    localLlmUrl: ss.localLlmUrl,
    azureEndpoint: ss.azureEndpoint,
    useSearchGrounding: ss.useSearchGrounding,
    temperature: ss.temperature,
    maxTokens: ss.maxTokens,
    reasoningMode: ss.reasoningMode,
    reasoningEffort: ss.reasoningEffort,
    reasoningTokenBudget: ss.reasoningTokenBudget,
    customApiUrl: ss.customApiUrl,
    customApiHeaders: ss.customApiHeaders,
    customApiBody: ss.customApiBody,
    customApiStream: ss.customApiStream,
    includeSystemMessagesInCustomApi: ss.includeSystemMessagesInCustomApi,
    customApiIncludeMimeType: ss.customApiIncludeMimeType,
  }
}

function handleApiError(errorCode: string): string {
  const languageCode = settingsStore.getState().selectLanguage
  i18next.changeLanguage(languageCode)
  return i18next.t(`Errors.${errorCode || 'AIAPIError'}`)
}

// APIエンドポイントを決定する関数
function getApiEndpoint(aiService: string): string {
  // isVercelLocalAIServiceを使用してapiサービスかどうかを判定
  if (isVercelLocalAIService(aiService) && aiService === 'custom-api') {
    return '/api/ai/custom'
  }
  return '/api/ai/vercel'
}

export async function getVercelAIChatResponse(messages: Message[]) {
  const {
    aiApiKey,
    selectAIService,
    selectAIModel,
    localLlmUrl,
    azureEndpoint,
    useSearchGrounding,
    temperature,
    maxTokens,
    reasoningMode,
    reasoningEffort,
    reasoningTokenBudget,
    customApiUrl,
    customApiHeaders,
    customApiBody,
    customApiIncludeMimeType,
  } = getAIConfig()

  // APIエンドポイントを決定
  const apiEndpoint = getApiEndpoint(selectAIService)

  try {
    // 共通リクエストデータ
    const requestData: any = {
      messages,
      stream: false,
    }

    // サービスタイプに応じてリクエストデータを追加
    if (selectAIService === 'custom-api') {
      // カスタムAPI用データ
      const filteredMessages = getAIConfig().includeSystemMessagesInCustomApi
        ? messages
        : messages.filter((message) => message.role !== 'system')

      Object.assign(requestData, {
        customApiUrl,
        customApiHeaders,
        customApiBody,
        temperature,
        maxTokens,
        customApiIncludeMimeType,
        messages: filteredMessages, // フィルタリングされたメッセージを使用
      })
    } else {
      // Vercel AI SDK用データ
      Object.assign(requestData, {
        apiKey: aiApiKey,
        aiService: selectAIService,
        model: selectAIModel,
        localLlmUrl,
        azureEndpoint,
        useSearchGrounding,
        temperature,
        maxTokens,
        reasoningMode,
        reasoningEffort,
        reasoningTokenBudget,
      })
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const responseBody = await response.json()
      throw new Error(
        `API request to ${selectAIService} failed with status ${response.status} and body ${responseBody.error}`,
        { cause: { errorCode: responseBody.errorCode } }
      )
    }

    const data = await response.json()
    return { text: data.text }
  } catch (error: any) {
    console.error(`Error fetching ${selectAIService} API response:`, error)
    const errorCode = error.cause
      ? error.cause.errorCode || 'AIAPIError'
      : 'AIAPIError'
    return { text: handleApiError(errorCode) }
  }
}

export async function getVercelAIChatResponseStream(
  messages: Message[]
): Promise<ReadableStream<string>> {
  const {
    aiApiKey,
    selectAIService,
    selectAIModel,
    localLlmUrl,
    azureEndpoint,
    useSearchGrounding,
    temperature,
    maxTokens,
    reasoningMode,
    reasoningEffort,
    reasoningTokenBudget,
    customApiUrl,
    customApiHeaders,
    customApiBody,
    customApiIncludeMimeType,
  } = getAIConfig()

  // APIエンドポイントを決定
  const apiEndpoint = getApiEndpoint(selectAIService)

  // 共通リクエストデータ
  const requestData: any = {
    messages,
    stream: true,
  }

  // サービスタイプに応じてリクエストデータを追加
  if (selectAIService === 'custom-api') {
    // カスタムAPI用データ
    const filteredMessages = getAIConfig().includeSystemMessagesInCustomApi
      ? messages
      : messages.filter((message) => message.role !== 'system')

    Object.assign(requestData, {
      customApiUrl,
      customApiHeaders,
      customApiBody,
      temperature,
      maxTokens,
      customApiIncludeMimeType,
      messages: filteredMessages, // フィルタリングされたメッセージを使用
    })
  } else {
    // Vercel AI SDK用データ
    Object.assign(requestData, {
      apiKey: aiApiKey,
      aiService: selectAIService,
      model: selectAIModel,
      localLlmUrl,
      azureEndpoint,
      useSearchGrounding,
      temperature,
      maxTokens,
      reasoningMode,
      reasoningEffort,
      reasoningTokenBudget,
    })
  }

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  })

  const contentType = response.headers.get('content-type') || ''
  const isPlainTextStream = contentType.includes('text/plain')

  try {
    if (!response.ok) {
      const responseBody = await response.json()
      throw new Error(
        `API request to ${selectAIService} failed with status ${response.status} and body ${responseBody.error}`,
        { cause: { errorCode: responseBody.errorCode } }
      )
    }

    return new ReadableStream({
      async start(controller) {
        if (!response.body) {
          throw new Error(
            `API response from ${selectAIService} is empty, status ${response.status}`,
            { cause: { errorCode: 'AIAPIError' } }
          )
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const decodedChunk = decoder.decode(value, { stream: true })

            if (isPlainTextStream) {
              if (decodedChunk) {
                controller.enqueue(decodedChunk)
              }
              continue
            }

            buffer += decodedChunk
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              // AI SDK UI Message Stream Protocol (SSE JSON形式)
              // https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
              //
              // 主なイベントタイプ:
              // - start, finish, abort: メッセージ制御
              // - text-start, text-delta, text-end: テキストコンテンツ
              // - reasoning-start, reasoning-delta, reasoning-end: 推論コンテンツ
              // - tool-input-start, tool-input-delta, tool-input-available: ツール入力
              // - tool-output-available: ツール出力
              // - source-url, source-document, file: ソース参照
              // - start-step, finish-step: ステップ制御
              // - error: エラー
              // - data-*: カスタムデータ
              if (line.startsWith('data:')) {
                const content = line.substring(5).trim()
                if (content === '[DONE]') continue

                try {
                  const data = JSON.parse(content)

                  if (data.type === 'text-delta' && data.delta) {
                    controller.enqueue(data.delta)
                  } else if (data.type === 'reasoning-delta' && data.delta) {
                    controller.enqueue(THINKING_MARKER + data.delta)
                  } else if (
                    data.type === 'tool-input-start' &&
                    data.toolName
                  ) {
                    console.log(`Tool called: ${data.toolName}`)
                    const message = i18next.t('Toasts.UsingTool', {
                      toolName: data.toolName,
                    })
                    toastStore.getState().addToast({
                      message,
                      type: 'tool',
                      tag: `vercel-tool-info-${data.toolName}`,
                      duration: 3000,
                    })
                  } else if (data.type === 'error') {
                    console.error(
                      `Error fetching ${selectAIService} API response:`,
                      data.errorText || data
                    )
                    toastStore.getState().addToast({
                      message: data.errorText || 'Unknown error',
                      type: 'error',
                      tag: 'vercel-api-error',
                    })
                  }
                  // その他のイベント（start, finish, text-start, text-end等）は無視
                } catch (error) {
                  console.error('Error parsing SSE JSON:', error)
                }
              } else if (line.trim() !== '') {
                // Ollamaなど、JSONLフォーマットのストリーミングデータに対応
                try {
                  const data = JSON.parse(line)
                  if (data.message?.content) {
                    controller.enqueue(data.message.content)
                  }
                } catch (error) {
                  console.error('Error parsing JSONL:', error, line)
                }
              }
            }
          }

          if (isPlainTextStream && buffer) {
            controller.enqueue(buffer)
          }
        } catch (error) {
          console.error(
            `Error fetching ${selectAIService} API response:`,
            error
          )

          const errorMessage = handleApiError('AIAPIError')
          toastStore.getState().addToast({
            message: errorMessage,
            type: 'error',
            tag: 'vercel-api-error',
          })
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })
  } catch (error: any) {
    const errorMessage = handleApiError(
      error.cause ? error.cause.errorCode : 'AIAPIError'
    )
    toastStore.getState().addToast({
      message: errorMessage,
      type: 'error',
      tag: 'vercel-api-error',
    })
    throw error
  }
}
