import { useEffect, useState } from 'react'
import { processReceivedMessage } from '@/features/chat/handlers'
import settingsStore from '@/features/stores/settings'

interface Message {
  id: number
  message: string
}

const MessageReceiver = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [lastId, setLastId] = useState(0)
  const clientId = settingsStore((state) => state.clientId)

  useEffect(() => {
    if (!clientId) return // clientIdがない場合は何もしない

    const intervalId = setInterval(() => {
      fetch(`/api/messages?lastId=${lastId}&clientId=${clientId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            setMessages((prevMessages) => [...prevMessages, ...data.messages])
            data.messages.forEach((message) => {
              processReceivedMessage(message.message)
            })
            const newLastId = data.messages[data.messages.length - 1].id
            setLastId(newLastId)
          }
        })
        .catch((error) => {
          console.error('Error fetching messages:', error)
        })
    }, 1000)

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
