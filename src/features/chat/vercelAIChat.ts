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
    return { text: data.text }
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
        controller.error(error)
      } finally {
        controller.close()
        reader.releaseLock()
      }
    },
  })
}
