import { Message } from '@/features/messages/messages'
import { useEffect, useState } from 'react'
import { processReceivedMessage } from '@/features/chat/handlers'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'

const MessageReceiver = () => {
  const [lastId, setLastId] = useState(0)
  const chatLog = homeStore((state) => state.chatLog)
  const clientId = settingsStore((state) => state.clientId)

  useEffect(() => {
    if (!clientId) return // clientIdがない場合は何もしない

    const intervalId = setInterval(() => {
      fetch(`/api/messages?lastId=${lastId}&clientId=${clientId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && data.messages.length > 0) {
            data.messages.forEach(
              (message: { id: number; message: string }) => {
                homeStore.setState({
                  chatLog: [
                    ...chatLog,
                    {
                      role: 'assistant',
                      content: message.message,
                    },
                  ],
                })
                processReceivedMessage(message.message)
              }
            )
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
  }, [lastId, clientId, chatLog])

  return <></>
}

export default MessageReceiver
