import { Message } from '../messages/messages'

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
      throw new Error(
        `API request to ${aiService} failed with status ${response.status} and body ${await response.text()}`
      )
    }

    if (!response.body) {
      throw new Error(
        `API response from ${aiService} is empty, status ${response.status}`
      )
    }

    const data = await response.json()
    return { message: data.message }
  } catch (error) {
    console.error(`Error fetching ${aiService} API response:`, error)
    throw error
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

  if (!response.ok) {
    throw new Error(
      `API request to ${aiService} failed with status ${response.status} and body ${await response.text()}`
    )
  }

  return new ReadableStream({
    async start(controller) {
      if (!response.body) {
        throw new Error(
          `API response from ${aiService} is empty, status ${response.status}`
        )
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('0:')) {
              const content = line.substring(2).trim().replace(/^"|"$/g, '')
              controller.enqueue(content)
            }
          }
        }
      } catch (error) {
        controller.error(error)
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })
}
