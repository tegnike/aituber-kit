import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Message {
  id: number
  message: string
}

const MessageReceiver = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [lastId, setLastId] = useState(0)
  const [clientId] = useState(uuidv4()) // 初回レンダリング時にUUIDを生成

  useEffect(() => {
    // 一定間隔でサーバーから新しいメッセージを取得
    const intervalId = setInterval(() => {
      fetch(`/api/messages?lastId=${lastId}&clientId=${clientId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages((prevMessages) => [...prevMessages, ...data.messages])
            // 最後のメッセージIDを更新
            const newLastId = data.messages[data.messages.length - 1].id
            setLastId(newLastId)
          }
        })
        .catch((error) => {
          console.error('Error fetching messages:', error)
        })
    }, 1000) // 1秒ごとにポーリング

    return () => {
      clearInterval(intervalId)
    }
  }, [lastId, clientId])

  return (
    <div>
      <h2>Received Messages:</h2>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>{msg.message}</li>
        ))}
      </ul>
    </div>
  )
}

export default MessageReceiver
