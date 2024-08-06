import { NextApiRequest, NextApiResponse } from 'next'
import Groq from 'groq-sdk'
import { Message } from '@/features/messages/messages'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages, apiKey, model, stream } = req.body

  console.log('Request body:', req.body)

  const client = new Groq({ apiKey })

  const systemMessage = messages.find(
    (message: any) => message.role === 'system'
  )
  let userMessages = messages.filter(
    (message: any) => message.role !== 'system'
  )

  userMessages = userMessages.filter(
    (message: Message) => message.content !== ''
  )

  const consolidatedMessages: Message[] = []
  let lastRole: string | null = null
  let combinedContent = ''

  userMessages.forEach((message: Message, index: number) => {
    if (message.role === lastRole) {
      combinedContent += '\n' + message.content
    } else {
      if (lastRole !== null) {
        consolidatedMessages.push({ role: lastRole, content: combinedContent })
      }
      lastRole = message.role
      combinedContent =
        typeof message.content === 'string'
          ? message.content
          : message.content[0].text
    }

    // 最後のメッセージの場合、現在の内容を追加
    if (index === userMessages.length - 1) {
      consolidatedMessages.push({ role: lastRole, content: combinedContent })
    }
  })

  userMessages = consolidatedMessages

  if (stream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const stream = await client.chat.completions
      .create({
        messages: [
          { role: 'system', content: systemMessage?.content },
          ...userMessages,
        ],
        model: model,
        max_tokens: 200,
        stream: true,
      })
      .catch(async (err) => {
        if (err instanceof Groq.APIError) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: err })}\n\n`
          )
          res.end()
        } else {
          throw err
        }
      })

    if (stream) {
      const reader = (
        stream as unknown as {
          getReader: () => ReadableStreamDefaultReader<Uint8Array>
        }
      ).getReader()
      const decoder = new TextDecoder('utf-8')

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`)
          res.end()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        console.log('chunk:', chunk)
        res.write(
          `data: ${JSON.stringify({ type: 'content_block_delta', text: chunk })}\n\n`
        )
      }
    }
  } else {
    const response = await client.chat.completions
      .create({
        messages: [
          { role: 'system', content: systemMessage?.content },
          ...userMessages,
        ],
        model: model,
        max_tokens: 200,
      })
      .catch(async (err) => {
        if (err instanceof Groq.APIError) {
          console.error('Groq API Error:', err)
          if (err.status) {
            res.status(err.status).json({ error: err })
          }
        } else {
          throw err
        }
      })

    if (response) {
      let messageContent = response.choices[0].message.content
      res.status(200).json({ message: messageContent })
    }
  }
}
