import settingsStore from '@/features/stores/settings'
import { Message } from '../messages/messages'

export async function getDifyChatResponseStream(
  messages: Message[],
  apiKey: string,
  url: string,
  conversationId: string
): Promise<ReadableStream<string>> {
  const response = await fetch('/api/difyChat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: messages[messages.length - 1].content,
      apiKey,
      url,
      conversationId,
      stream: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`API request to Dify failed with status ${response.status}`)
  }

  return new ReadableStream({
    async start(controller) {
      if (!response.body) {
        throw new Error('API response from Dify is empty')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const textChunk = decoder.decode(value, { stream: true })
          const messages = textChunk
            .split('\n')
            .filter((line) => line.startsWith('data:'))
          messages.forEach((message) => {
            const data = JSON.parse(message.slice(5)) // Remove 'data:' prefix
            if (data.event === 'agent_message' || data.event === 'message') {
              controller.enqueue(data.answer)
              settingsStore.setState({
                difyConversationId: data.conversation_id,
              })
            }
          })
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
