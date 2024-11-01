import { useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { TmpMessage } from './realtimeAPIUtils'
import useWebSocketStore from '@/features/stores/websocketStore'

interface Params {
  handleReceiveTextFromRt: (
    text: string,
    role?: string,
    type?: string,
    buffer?: ArrayBuffer
  ) => Promise<void>
}

const useRealtimeAPI = ({ handleReceiveTextFromRt }: Params) => {
  const { t } = useTranslation()
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)

  const processMessage = useCallback(
    async (message: TmpMessage) => {
      await handleReceiveTextFromRt(
        message.text,
        message.role,
        message.type,
        message.buffer
      )
    },
    [handleReceiveTextFromRt]
  )

  useEffect(() => {
    const ss = settingsStore.getState()
    if (!ss.realtimeAPIMode || !ss.selectAIService) return

    useWebSocketStore.getState().initializeWebSocket(t, processMessage)

    const wsManager = useWebSocketStore.getState().wsManager

    const reconnectInterval = setInterval(() => {
      const ss = settingsStore.getState()
      if (
        ss.realtimeAPIMode &&
        wsManager?.websocket &&
        wsManager.websocket.readyState !== WebSocket.OPEN &&
        wsManager.websocket.readyState !== WebSocket.CONNECTING
      ) {
        homeStore.setState({ chatProcessing: false })
        console.log('再接続を試みています...')
        wsManager.disconnect()
        useWebSocketStore.getState().initializeWebSocket(t, processMessage)
      }
    }, 2000)

    return () => {
      clearInterval(reconnectInterval)
      useWebSocketStore.getState().disconnect()
    }
  }, [realtimeAPIMode, processMessage, t])

  return null
}

export default useRealtimeAPI
