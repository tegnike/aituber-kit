import { create } from 'zustand'
import { WebSocketManager } from '@/utils/WebSocketManager'
import { TmpMessage } from '@/components/realtimeAPIUtils'

interface WebSocketState {
  wsManager: WebSocketManager | null
  initializeWebSocket: (
    t: (key: string, options?: any) => string,
    processMessage: (message: TmpMessage) => Promise<void>
  ) => void
  sendFunctionCallOutput: (
    callId: string,
    output: Record<string, unknown>
  ) => void
  disconnect: () => void
  reconnect: () => boolean
}

const useWebSocketStore = create<WebSocketState>((set, get) => ({
  wsManager: null,
  initializeWebSocket: (t, processMessage) => {
    const manager = new WebSocketManager(t, processMessage)
    manager.connect()
    set({ wsManager: manager })
  },
  sendFunctionCallOutput: (callId, output) => {
    const { wsManager } = get()
    wsManager?.sendFunctionCallOutput(callId, output)
  },
  disconnect: () => {
    const { wsManager } = get()
    wsManager?.disconnect()
    set({ wsManager: null })
  },
  reconnect: () => {
    const { wsManager } = get()
    return wsManager ? wsManager.reconnect() : false
  },
}))

export default useWebSocketStore
