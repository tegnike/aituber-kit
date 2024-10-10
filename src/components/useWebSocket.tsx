import { useEffect, useState, useCallback } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'

///取得したコメントをストックするリストの作成（tmpMessages）
interface TmpMessage {
  text: string
  role: string
  emotion: string
  state: string
}

interface Params {
  handleReceiveTextFromWs: (
    text: string,
    role?: string,
    state?: string
  ) => Promise<void>
}

const useWebSocket = ({ handleReceiveTextFromWs }: Params) => {
  const webSocketMode = settingsStore((s) => s.webSocketMode)
  const [tmpMessages, setTmpMessages] = useState<TmpMessage[]>([])

  const processMessage = useCallback(
    async (message: TmpMessage) => {
      await handleReceiveTextFromWs(message.text, message.role, message.state)
    },
    [handleReceiveTextFromWs]
  )

  useEffect(() => {
    if (tmpMessages.length > 0) {
      const message = tmpMessages[0]
      if (
        message.role === 'output' ||
        message.role === 'executing' ||
        message.role === 'console'
      ) {
        message.role = 'code'
      }
      setTmpMessages((prev) => prev.slice(1))
      processMessage(message)
    }
  }, [tmpMessages, processMessage])

  // WebSocket接続の設定（既存のコード）
  useEffect(() => {
    const ss = settingsStore.getState()
    if (!ss.webSocketMode) return

    const handleOpen = (event: Event) => {
      console.log('WebSocket connection opened:', event)
    }
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data)
      const jsonData = JSON.parse(event.data)
      setTmpMessages((prevMessages) => [...prevMessages, jsonData])
    }
    const handleError = (event: Event) => {
      console.error('WebSocket error:', event)
    }
    const handleClose = (event: Event) => {
      console.log('WebSocket connection closed:', event)
    }

    function setupWebsocket() {
      const ws = new WebSocket('ws://localhost:8000/ws')
      ws.addEventListener('open', handleOpen)
      ws.addEventListener('message', handleMessage)
      ws.addEventListener('error', handleError)
      ws.addEventListener('close', handleClose)
      return ws
    }
    let ws = setupWebsocket()
    homeStore.setState({ ws })

    const reconnectInterval = setInterval(() => {
      const ss = settingsStore.getState()
      if (
        ss.webSocketMode &&
        ws.readyState !== WebSocket.OPEN &&
        ws.readyState !== WebSocket.CONNECTING
      ) {
        homeStore.setState({ chatProcessing: false })
        console.log('try reconnecting...')
        ws.close()
        ws = setupWebsocket()
        homeStore.setState({ ws })
      }
    }, 1000)

    return () => {
      clearInterval(reconnectInterval)
      ws.close()
      homeStore.setState({ ws: null })
    }
  }, [webSocketMode])

  return null
}

export default useWebSocket
