import { NextApiRequest, NextApiResponse } from 'next'

interface Message {
  id: number
  message: string
}

interface MessageQueue {
  messages: Message[]
  lastAccessed: number
}

let messagesPerClient: { [clientId: string]: MessageQueue } = {}

let nextId = 1 // メッセージのIDを管理

const CLIENT_TIMEOUT = 1000 * 60 * 5 // 5分

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  const clientId = req.query.clientId as string

  if (!clientId) {
    res.status(400).json({ error: 'Client ID is required' })
    return
  }

  if (req.method === 'POST') {
    const { message } = req.body

    if (!message) {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    // クライアントキューのクリーンアップ
    cleanupClientQueues()

    // クライアントのキューが存在しない場合は作成
    if (!messagesPerClient[clientId]) {
      messagesPerClient[clientId] = { messages: [], lastAccessed: Date.now() }
    }

    // メッセージをクライアントのキューに追加
    messagesPerClient[clientId].messages.push({ id: nextId++, message })
    messagesPerClient[clientId].lastAccessed = Date.now()

    res.status(201).json({ status: 'Message sent' })
  } else if (req.method === 'GET') {
    // クライアントのキューが存在しない場合は作成
    if (!messagesPerClient[clientId]) {
      messagesPerClient[clientId] = { messages: [], lastAccessed: Date.now() }
    }

    const lastId = parseInt(req.query.lastId as string, 10) || 0

    // クライアントのキューから新しいメッセージを取得
    const clientQueue = messagesPerClient[clientId]
    const newMessages = clientQueue.messages.filter((msg) => msg.id > lastId)

    res.status(200).json({ messages: newMessages })

    // 取得済みのメッセージをキューから削除
    clientQueue.messages = clientQueue.messages.filter(
      (msg) => msg.id <= lastId
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
