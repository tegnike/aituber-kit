import { Message } from '../messages/messages'

export async function getLocalLLMChatResponseStream(
  messages: Message[],
  localLlmUrl: string,
  model?: string
) {
  const response = await fetch('/api/local-llm', {
    method: 'POST',
    body: JSON.stringify({
      localLlmUrl,
      model,
      messages,
    }),
  })

  const stream = response.body
  if (!stream) {
    throw new Error('No stream in response')
  }

  const reader = stream.getReader()

  const res = new ReadableStream({
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
      } catch (error) {
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })

  return res
}
