import { Message } from '../messages/messages'
import i18next from 'i18next'
import settingsStore, {
  multiModalAIServiceKey,
} from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'

const getAIConfig = () => {
  const ss = settingsStore.getState()
  const aiService = ss.selectAIService as multiModalAIServiceKey

  const apiKeyName = `${aiService}Key` as const
  const apiKey = ss[apiKeyName]

  return {
    aiApiKey: apiKey,
    selectAIService: aiService,
    selectAIModel: ss.selectAIModel,
    azureEndpoint: ss.azureEndpoint,
    useSearchGrounding: ss.useSearchGrounding,
    temperature: ss.temperature,
  }
}

function handleApiError(errorCode: string): string {
  const languageCode = settingsStore.getState().selectLanguage
  i18next.changeLanguage(languageCode)
  return i18next.t(`Errors.${errorCode || 'AIAPIError'}`)
}

export async function getVercelAIChatResponse(messages: Message[]) {
  const {
    aiApiKey,
    selectAIService,
    selectAIModel,
    azureEndpoint,
    useSearchGrounding,
    temperature,
  } = getAIConfig()

  try {
    const response = await fetch('/api/aiChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        apiKey: aiApiKey,
        aiService: selectAIService,
        model: selectAIModel,
        azureEndpoint: azureEndpoint,
        stream: false,
        useSearchGrounding: useSearchGrounding,
        temperature: temperature,
      }),
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
    const errorCode = error.cause?.errorCode || 'AIAPIError'
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
    azureEndpoint,
    useSearchGrounding,
    temperature,
  } = getAIConfig()

  const response = await fetch('/api/aiChat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      apiKey: aiApiKey,
      aiService: selectAIService,
      model: selectAIModel,
      azureEndpoint: azureEndpoint,
      stream: true,
      useSearchGrounding: useSearchGrounding,
      temperature: temperature,
    }),
  })

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

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('0:')) {
                const content = line.substring(2).trim()
                const decodedContent = JSON.parse(content)
                controller.enqueue(decodedContent)
              }
            }
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
    const errorMessage = handleApiError(error.cause.errorCode)
    toastStore.getState().addToast({
      message: errorMessage,
      type: 'error',
      tag: 'vercel-api-error',
    })
    throw error
  }
}
