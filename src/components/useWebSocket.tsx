import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'

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
  const { t } = useTranslation()
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

  function removeToast() {
    toastStore.getState().removeToast('websocket-connection-error')
    toastStore.getState().removeToast('websocket-connection-close')
    toastStore.getState().removeToast('websocket-connection-info')
  }

  // WebSocket接続の設定（既存のコードを修正）
  useEffect(() => {
    const ss = settingsStore.getState()
    if (!ss.webSocketMode) return

    const handleOpen = (event: Event) => {
      console.log('WebSocket connection opened:', event)
      removeToast()
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketConnectionSuccess'),
        type: 'success',
        duration: 3000,
        tag: 'websocket-connection-success',
      })
    }
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data)
      const jsonData = JSON.parse(event.data)
      setTmpMessages((prevMessages) => [...prevMessages, jsonData])
    }
    const handleError = (event: Event) => {
      console.error('WebSocket error:', event)
      removeToast()
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketConnectionError'),
        type: 'error',
        duration: 5000,
        tag: 'websocket-connection-error',
      })
    }
    const handleClose = (event: Event) => {
      console.log('WebSocket connection closed:', event)
      removeToast()
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketConnectionClosed'),
        type: 'error',
        duration: 3000,
        tag: 'websocket-connection-close',
      })
    }

    function setupWebsocket() {
      removeToast()
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketConnectionAttempt'),
        type: 'info',
        duration: 10000,
        tag: 'websocket-connection-info',
      })

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
  }, [webSocketMode, t])

  return null
}

export default useWebSocket
