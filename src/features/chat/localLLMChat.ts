import { Message } from '../messages/messages'
import i18next from 'i18next'
import toastStore from '@/features/stores/toast'
import settingsStore from '@/features/stores/settings'

function handleApiError(errorCode: string): string {
  const languageCode = settingsStore.getState().selectLanguage
  i18next.changeLanguage(languageCode)
  return i18next.t(`Errors.${errorCode || 'LocalLLMError'}`)
}

export async function getLocalLLMChatResponseStream(
  messages: Message[],
  localLlmUrl: string,
  model?: string
) {
  try {
    const response = await fetch('/api/local-llm', {
      method: 'POST',
      body: JSON.stringify({
        localLlmUrl,
        model,
        messages,
        temperature: settingsStore.getState().temperature,
      }),
    })

    if (!response.ok) {
      const responseBody = await response.json()
      throw new Error(
        `Local LLM API request failed with status ${response.status}`,
        { cause: { errorCode: responseBody.errorCode } }
      )
    }

    const stream = response.body
    if (!stream) {
      throw new Error('No stream in response', {
        cause: { errorCode: 'LocalLLMStreamError' },
      })
    }

    const reader = stream.getReader()

    return new ReadableStream({
      async start(controller: ReadableStreamDefaultController) {
        let accumulatedChunks = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            accumulatedChunks += chunk

            try {
              const trimmedChunks = accumulatedChunks.trimStart()
              const data = JSON.parse(trimmedChunks.slice(6))

              if (data.choices && data.choices.length > 0) {
                const content = data.choices[0].delta.content
                controller.enqueue(content)
                accumulatedChunks = ''
              }
            } catch (error) {
              // JSONが不完全な場合は続行
            }
          }
        } catch (error: any) {
          console.error('Error in Local LLM stream:', error)
          const errorMessage = handleApiError(
            error.cause?.errorCode || 'LocalLLMStreamError'
          )
          toastStore.getState().addToast({
            message: errorMessage,
            type: 'error',
            tag: 'local-llm-error',
          })
          controller.error(error)
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })
  } catch (error: any) {
    console.error('Error in Local LLM request:', error)
    const errorMessage = handleApiError(
      error.cause?.errorCode || 'LocalLLMError'
    )
    toastStore.getState().addToast({
      message: errorMessage,
      type: 'error',
      tag: 'local-llm-error',
    })
    throw error
  }
}
