import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { Message } from '@/features/messages/messages'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages, apiKey, model, stream } = req.body

  const client = new OpenAI({ apiKey })

  if (stream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    const stream = await client.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      max_tokens: 200,
    })

    for await (const chunk of stream) {
      const messagePiece = chunk.choices[0].delta.content
      if (messagePiece) {
        res.write(
          `data: ${JSON.stringify({ type: 'content_block_delta', text: messagePiece })}\n\n`
        )
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`)
    res.end()
  } else {
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 200,
    })

    res.status(200).json({ message: response.choices[0].message.content })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
