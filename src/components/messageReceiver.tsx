import { useEffect, useState, useCallback } from 'react'
import { speakMessageHandler } from '@/features/chat/handlers'
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

  const speakMessage = useCallback((messages: Message[]) => {
    messages.forEach((message) => speakMessageHandler(message.message))
  }, [])

  useEffect(() => {
    if (!clientId) return

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/messages?lastTimestamp=${lastTimestamp}&clientId=${clientId}`
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          speakMessage(data.messages)
          const newLastTimestamp =
            data.messages[data.messages.length - 1].timestamp
          setLastTimestamp(newLastTimestamp)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
    }

    const intervalId = setInterval(fetchMessages, 1000)

    return () => clearInterval(intervalId)
  }, [lastTimestamp, clientId, speakMessage])

  return <></>
}

export default MessageReceiver
