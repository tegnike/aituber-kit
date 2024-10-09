import { useEffect, useState, useCallback } from 'react'
import { processReceivedMessage } from '@/features/chat/handlers'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'

class Message {
  timestamp: number
  message: string

  constructor(timestamp: number, message: string) {
    this.timestamp = timestamp
    this.message = message
  }
}

const MessageReceiver = () => {
  const [lastTimestamp, setLastTimestamp] = useState(0)
  const clientId = settingsStore((state) => state.clientId)

  const updateChatLog = useCallback((messages: Message[]) => {
    homeStore.setState((state) => ({
      chatLog: [
        ...state.chatLog,
        ...messages.map((message) => ({
          role: 'assistant',
          content: message.message,
        })),
      ],
    }))
    messages.forEach((message) => processReceivedMessage(message.message))
  }, [])

  useEffect(() => {
    if (!clientId) return

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages?lastTimestamp=${lastTimestamp}&clientId=${clientId}`
        )
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          updateChatLog(data.messages)
          const newLastTimestamp =
            data.messages[data.messages.length - 1].timestamp
          setLastTimestamp(newLastTimestamp)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    const intervalId = setInterval(fetchMessages, 1000) // 5秒ごとに変更

    return () => clearInterval(intervalId)
  }, [lastTimestamp, clientId, updateChatLog]) // chatLogを依存配列から除外し、updateChatLogを追加

  return <></>
}

export default MessageReceiver
