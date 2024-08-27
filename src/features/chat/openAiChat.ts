import { Message } from '../messages/messages'

export async function getOpenAIChatResponse(
  messages: Message[],
  apiKey: string,
  model: string
) {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, apiKey, model }),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch OpenAI API response')
    }

    const data = await response.json()
    return { message: data.message }
  } catch (error) {
    console.error('Error fetching OpenAI API response:', error)
    throw error
  }
}

export async function getOpenAIChatResponseStream(
  messages: Message[],
  apiKey: string,
  model: string
) {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, apiKey, model, stream: true }),
    })

    if (!response.ok) {
      throw new Error('OpenAI APIリクエストに失敗しました')
    }

    if (!response.body) {
      throw new Error('OpenAI APIレスポンスが空です')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    return new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.substring(5).trim()
              if (data !== '[DONE]') {
                const event = JSON.parse(data)
                switch (event.type) {
                  case 'content_block_delta':
                    controller.enqueue(event.text)
                    break
                  case 'error':
                    throw new Error(
                      `OpenAI API error: ${JSON.stringify(event.error)}`
                    )
                  case 'message_stop':
                    controller.close()
                    return
                }
              }
            }
          }
        }

        controller.close()
      },
    })
  } catch (error) {
    console.error('Error fetching OpenAI API response stream:', error)
    throw error
  }
}
