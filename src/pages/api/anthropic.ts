import { NextApiRequest, NextApiResponse } from 'next'
import { Anthropic } from '@anthropic-ai/sdk'
import { Message } from '@/features/messages/messages'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { messages, apiKey, model, stream } = req.body

  const client = new Anthropic({ apiKey })
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

  while (
    consolidatedMessages.length > 0 &&
    consolidatedMessages[0].role !== 'user'
  ) {
    consolidatedMessages.shift()
  }

  userMessages = consolidatedMessages

  if (stream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    await client.messages
      .stream({
        system: systemMessage?.content,
        messages: userMessages,
        model: model,
        max_tokens: 200,
      })
      .on('text', (text) => {
        res.write(
          `data: ${JSON.stringify({ type: 'content_block_delta', text })}\n\n`
        )
      })
      .on('error', (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`)
      })
      .on('end', () => {
        res.write(`data: ${JSON.stringify({ type: 'message_stop' })}\n\n`)
        res.end()
      })
  } else {
    const response = await client.messages.create({
      system: systemMessage?.content,
      messages: userMessages,
      model: model,
      max_tokens: 200,
    })

    res.status(200).json({ message: response.content })
  }
}
