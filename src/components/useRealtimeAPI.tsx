import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import {
  TmpMessage,
  Params,
  setupWebsocket,
  handleMessage,
  removeToast,
  sendSessionUpdate,
} from './realtimeAPIUtils'

const useRealtimeAPI = ({ handleReceiveTextFromRt }: Params) => {
  const { t } = useTranslation()
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const accumulatedAudioDataRef = useRef<Int16Array>(new Int16Array())

  const processMessage = useCallback(
    async (message: TmpMessage) => {
      await handleReceiveTextFromRt(
        message.text,
        message.role,
        message.state,
        message.buffer
      )
    },
    [handleReceiveTextFromRt]
  )

  useEffect(() => {
    const ss = settingsStore.getState()
    if (!ss.realtimeAPIMode || !ss.selectAIService) return

    const handleOpen = (event: Event) => {
      console.log('WebSocket connection opened:', event)
      removeToast()
      // chatLogを空配列に初期化
      homeStore.setState({ ws: ws, chatLog: [] })
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketConnectionSuccess'),
        type: 'success',
        duration: 3000,
        tag: 'websocket-connection-success',
      })
      if (ws) {
        sendSessionUpdate(ws)
      }
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

    let ws = setupWebsocket(t)
    if (ws) {
      ws.addEventListener('open', handleOpen)
      ws.addEventListener('message', (event) =>
        handleMessage(event, accumulatedAudioDataRef, processMessage, ws!, t)
      )
      ws.addEventListener('error', handleError)
      ws.addEventListener('close', handleClose)
    }
    homeStore.setState({ ws })

    const reconnectInterval = setInterval(() => {
      const ss = settingsStore.getState()
      if (
        ss.realtimeAPIMode &&
        ws &&
        ws.readyState !== WebSocket.OPEN &&
        ws.readyState !== WebSocket.CONNECTING
      ) {
        homeStore.setState({ chatProcessing: false })
        console.log('try reconnecting...')
        ws.close()
        ws = setupWebsocket(t)
        if (ws) {
          ws.addEventListener('open', handleOpen)
          ws.addEventListener('message', (event) =>
            handleMessage(
              event,
              accumulatedAudioDataRef,
              processMessage,
              ws!,
              t
            )
          )
          ws.addEventListener('error', handleError)
          ws.addEventListener('close', handleClose)
        }
        homeStore.setState({ ws })
      }
    }, 2000)

    return () => {
      clearInterval(reconnectInterval)
      if (ws) {
        ws.close()
        homeStore.setState({ ws: null })
      }
    }
  }, [realtimeAPIMode, processMessage, t])

  return null
}

export default useRealtimeAPI
