import { Message } from '../messages/messages'
import settingsStore from '@/features/stores/settings'
import i18next from 'i18next'

function handleApiError(errorCode: string): string {
  const languageCode = settingsStore.getState().selectLanguage
  i18next.changeLanguage(languageCode)
  return i18next.t(`Errors.${errorCode || 'AIAPIError'}`)
}

export async function getVercelAIChatResponse(
  messages: Message[],
  apiKey: string,
  aiService: string,
  model: string
) {
  try {
    const response = await fetch('/api/aiChat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        apiKey,
        aiService,
        model,
        stream: false,
      }),
    })

    if (!response.ok) {
      const responseBody = await response.json()
      throw new Error(
        `API request to ${aiService} failed with status ${response.status} and body ${responseBody.error}`,
        { cause: { errorCode: responseBody.errorCode } }
      )
    }

    const data = await response.json()
    return { text: data.text }
  } catch (error: any) {
    console.error(`Error fetching ${aiService} API response:`, error)
    return { text: handleApiError(error.cause.errorCode) }
  }
}

export async function getVercelAIChatResponseStream(
  messages: Message[],
  apiKey: string,
  aiService: string,
  model: string
): Promise<ReadableStream<string>> {
  const response = await fetch('/api/aiChat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      apiKey,
      aiService,
      model,
      stream: true,
    }),
  })

  try {
    if (!response.ok) {
      const responseBody = await response.json()
      throw new Error(
        `API request to ${aiService} failed with status ${response.status} and body ${responseBody.error}`,
        { cause: { errorCode: responseBody.errorCode } }
      )
    }

    return new ReadableStream({
      async start(controller) {
        if (!response.body) {
          throw new Error(
            `API response from ${aiService} is empty, status ${response.status}`,
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
          console.error(`Error fetching ${aiService} API response:`, error)

          return new ReadableStream({
            start(controller) {
              const errorMessage = handleApiError('AIAPIError')
              controller.enqueue(errorMessage)
              controller.close()
            },
          })
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })
  } catch (error: any) {
    const errorMessage = handleApiError(error.cause.errorCode)
    return new ReadableStream({
      start(controller) {
        controller.enqueue(errorMessage)
        controller.close()
      },
    })
  }
}
