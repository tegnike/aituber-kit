import { Message } from '../messages/messages'

export async function getAnthropicChatResponse(
  messages: Message[],
  apiKey: string,
  model: string
) {
  const response = await fetch('/api/anthropic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, apiKey, model }),
  })

  const data = await response.json()
  return { message: data.message[0].text }
}

export async function getAnthropicChatResponseStream(
  messages: Message[],
  apiKey: string,
  model: string
) {
  const response = await fetch('/api/anthropic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, apiKey, model, stream: true }),
  })

  if (!response.ok) {
    throw new Error('Anthropic APIリクエストに失敗しました')
  }

  if (!response.body) {
    throw new Error('Anthropic APIレスポンスが空です')
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
                    `Anthropic API error: ${JSON.stringify(event.error)}`
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
}
