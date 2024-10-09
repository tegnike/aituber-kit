import { NextApiRequest, NextApiResponse } from 'next'

interface Message {
  timestamp: number
  message: string
}

interface MessageQueue {
  messages: Message[]
  lastAccessed: number
}

let messagesPerClient: { [clientId: string]: MessageQueue } = {}

const CLIENT_TIMEOUT = 1000 * 60 * 5 // 5分

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = req.query.clientId as string

  if (!clientId) {
    res.status(400).json({ error: 'Client ID is required' })
    return
  }

  if (req.method === 'POST') {
    const { messages } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' })
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
      })
    })
    messagesPerClient[clientId].lastAccessed = timestamp

    res.status(201).json({ message: 'Successfully sent' })
  } else if (req.method === 'GET') {
    // クライアントのキューが存在しない場合は作成
    if (!messagesPerClient[clientId]) {
      messagesPerClient[clientId] = { messages: [], lastAccessed: Date.now() }
    }

    const lastTimestamp = parseInt(req.query.lastTimestamp as string, 10) || 0

    // クライアントのキューから新しいメッセージを取得
    const clientQueue = messagesPerClient[clientId]
    const newMessages = clientQueue.messages.filter(
      (msg) => msg.timestamp > lastTimestamp
    )

    console.log(newMessages)

    res.status(200).json({ messages: newMessages })

    // 取得済みのメッセージをキューから削除
    clientQueue.messages = clientQueue.messages.filter(
      (msg) => msg.timestamp <= lastTimestamp
    )
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
