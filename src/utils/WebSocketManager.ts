import toastStore from '@/features/stores/toast'
import settingsStore from '@/features/stores/settings'

type TranslationFunction = (key: string, options?: any) => string

export class WebSocketManager {
  private ws: WebSocket | null = null
  private t: TranslationFunction
  private isTextBlockStarted: boolean = false
  private handlers: {
    onOpen: (event: Event) => void
    onMessage: (event: MessageEvent) => Promise<void>
    onError: (event: Event) => void
    onClose: (event: Event) => void
  }
  private connectWebsocket: () => WebSocket | null

  constructor(
    t: TranslationFunction,
    handlers: {
      onOpen: (event: Event) => void
      onMessage: (event: MessageEvent) => Promise<void>
      onError: (event: Event) => void
      onClose: (event: Event) => void
    },
    connectWebsocket: () => WebSocket | null
  ) {
    this.t = t
    this.handlers = handlers
    this.connectWebsocket = connectWebsocket
  }

  private handleOpen = (event: Event) => {
    console.log('WebSocket connection opened:', event)
    this.removeToast()
    toastStore.getState().addToast({
      message: this.t('Toasts.WebSocketConnectionSuccess'),
      type: 'success',
      duration: 3000,
      tag: 'websocket-connection-success',
    })
    this.handlers.onOpen(event)
  }

  private handleMessage = async (event: MessageEvent) => {
    console.log('WebSocket received message:', event)
    await this.handlers.onMessage(event)
  }

  private handleError = (event: Event) => {
    console.error('WebSocket error:', event)
    this.removeToast()
    toastStore.getState().addToast({
      message: this.t('Toasts.WebSocketConnectionError'),
      type: 'error',
      duration: 5000,
      tag: 'websocket-connection-error',
    })
    this.handlers.onError(event)
  }

  private handleClose = (event: Event) => {
    console.log('WebSocket connection closed:', event)
    this.removeToast()
    toastStore.getState().addToast({
      message: this.t('Toasts.WebSocketConnectionClosed'),
      type: 'error',
      duration: 3000,
      tag: 'websocket-connection-close',
    })
    this.handlers.onClose(event)
  }

  public connect() {
    this.removeToast()
    toastStore.getState().addToast({
      message: this.t('Toasts.WebSocketConnectionAttempt'),
      type: 'info',
      duration: 10000,
      tag: 'websocket-connection-info',
    })

    this.ws = this.connectWebsocket()

    if (!this.ws) return

    this.ws.addEventListener('open', this.handleOpen)
    this.ws.addEventListener('message', this.handleMessage)
    this.ws.addEventListener('error', this.handleError)
    this.ws.addEventListener('close', this.handleClose)
  }

  public removeToast() {
    toastStore.getState().removeToast('websocket-connection-error')
    toastStore.getState().removeToast('websocket-connection-success')
    toastStore.getState().removeToast('websocket-connection-close')
    toastStore.getState().removeToast('websocket-connection-info')
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
    }
  }

  public get websocket(): WebSocket | null {
    return this.ws
  }

  public get textBlockStarted(): boolean {
    return this.isTextBlockStarted
  }

  setTextBlockStarted(value: boolean) {
    this.isTextBlockStarted = value
  }

  public reconnect(): boolean {
    const ss = settingsStore.getState()
    if (!ss.realtimeAPIMode || !ss.selectAIService) return false

    this.disconnect()
    this.connect()

    return true
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}
