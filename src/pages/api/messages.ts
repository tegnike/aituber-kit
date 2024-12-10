import { NextApiRequest, NextApiResponse } from 'next'

type MessageType = 'direct_send' | 'ai_generate' | 'user_input'

interface ReceivedMessage {
  timestamp: number
  message: string
  type: MessageType
  systemPrompt?: string
  useCurrentSystemPrompt?: boolean
}

interface MessageQueue {
  messages: ReceivedMessage[]
  lastAccessed: number
}

let messagesPerClient: { [clientId: string]: MessageQueue } = {}

const CLIENT_TIMEOUT = 1000 * 60 * 5 // 5分

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = req.query.clientId as string
  const type = (req.query.type as MessageType) || 'direct_send'

  if (!clientId) {
    res.status(400).json({ error: 'Client ID is required' })
    return
  }

  if (req.method === 'POST') {
    const { messages, systemPrompt, useCurrentSystemPrompt } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' })
      return
    }
    if (systemPrompt && typeof systemPrompt !== 'string') {
      res.status(400).json({ error: 'System prompt is not a string' })
      return
    }
    if (useCurrentSystemPrompt && typeof useCurrentSystemPrompt !== 'boolean') {
      res.status(400).json({ error: 'useCurrentSystemPrompt is not a boolean' })
      return
    }

    // クライアントキューのクリーンアップ
    cleanupClientQueues()

    // クライアントのキューが存在しない場合は作成
    if (!messagesPerClient[clientId]) {
      messagesPerClient[clientId] = { messages: [], lastAccessed: Date.now() }
    }

    // メッセージをクライアントのキューに追加
    const timestamp = Date.now()
    messages.forEach((message) => {
      messagesPerClient[clientId].messages.push({
        timestamp,
        message,
        type,
        systemPrompt,
        useCurrentSystemPrompt,
      })
    })
    messagesPerClient[clientId].lastAccessed = timestamp

    res.status(201).json({ message: 'Successfully sent' })
  } else if (req.method === 'GET') {
    // クライアントのキューが存在しない場合は作成
    if (!messagesPerClient[clientId]) {
      messagesPerClient[clientId] = { messages: [], lastAccessed: Date.now() }
    }

    // クライアントのキューから全てのメッセージを取得
    const clientQueue = messagesPerClient[clientId]
    const newMessages = clientQueue.messages

    res.status(200).json({ messages: newMessages })

    // キューをクリア
    clientQueue.messages = []
    clientQueue.lastAccessed = Date.now()
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

// 古いクライアントのキューを削除
function cleanupClientQueues() {
  const now = Date.now()
  for (const clientId of Object.keys(messagesPerClient)) {
    if (now - messagesPerClient[clientId].lastAccessed > CLIENT_TIMEOUT) {
      delete messagesPerClient[clientId]
    }
  }
}

export default handler
