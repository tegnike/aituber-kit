import { AudioBufferManager } from '@/utils/audioBufferManager'
import {
  TmpMessage,
  SessionConfig,
  base64ToArrayBuffer,
} from '@/components/realtimeAPIUtils'
import homeStore from '@/features/stores/home'
import toastStore from '@/features/stores/toast'
import settingsStore from '@/features/stores/settings'
import RealtimeAPITools from '@/components/realtimeAPITools.json'

type TranslationFunction = (key: string, options?: any) => string

export class WebSocketManager {
  private ws: WebSocket | null = null
  private accumulatedAudioDataRef: React.MutableRefObject<AudioBufferManager>
  private t: TranslationFunction
  private processMessage: (message: TmpMessage) => Promise<void>
  private isStreaming: boolean = false

  constructor(
    t: TranslationFunction,
    processMessage: (message: TmpMessage) => Promise<void>
  ) {
    this.t = t
    this.processMessage = processMessage
    this.accumulatedAudioDataRef = {
      current: new AudioBufferManager(async (buffer) => {
        await this.processMessage({
          text: '',
          role: 'assistant',
          emotion: '',
          type: 'response.audio',
          buffer: buffer,
        })
      }),
    }
  }

  private handleMessage = async (event: MessageEvent) => {
    try {
      const jsonData = JSON.parse(event.data)
      const type = jsonData.type || ''

      await this.handleMessageType(jsonData, type)
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }

  private handleMessageEvent = (event: MessageEvent) => {
    this.handleMessage(event)
  }

  public sendSessionUpdate() {
    const ss = settingsStore.getState()
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const wsConfig: SessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: ss.systemPrompt,
          voice: ss.realtimeAPIModeVoice,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
          },
          turn_detection: null,
          temperature: 0.8,
          max_response_output_tokens: 4096,
        },
      }

      // realtimeAPITools.jsonからツール情報を取得
      if (RealtimeAPITools && RealtimeAPITools.length > 0) {
        ;(wsConfig.session as any).tools = RealtimeAPITools
        ;(wsConfig.session as any).tool_choice = 'auto'
      }

      const wsConfigString = JSON.stringify(wsConfig)
      this.ws.send(wsConfigString)
    }
  }

  public connect() {
    const ss = settingsStore.getState()
    if (!ss.selectAIService) return

    this.removeToast()
    toastStore.getState().addToast({
      message: this.t('Toasts.WebSocketConnectionAttempt'),
      type: 'info',
      duration: 10000,
      tag: 'websocket-connection-info',
    })

    if (ss.selectAIService === 'openai') {
      const url =
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'
      this.ws = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${ss.openaiKey}`,
        'openai-beta.realtime-v1',
      ])
    } else if (ss.selectAIService === 'azure') {
      const url = `${ss.azureEndpoint}&api-key=${ss.azureKey}`
      this.ws = new WebSocket(url, [])
    } else {
      return
    }

    this.ws.addEventListener('open', this.handleOpen)
    this.ws.addEventListener('message', this.handleMessageEvent)
    this.ws.addEventListener('error', this.handleError)
    this.ws.addEventListener('close', this.handleClose)
  }

  private handleOpen = (event: Event) => {
    console.log('WebSocket connection opened:', event)
    this.removeToast()
    homeStore.setState({ chatLog: [] })
    toastStore.getState().addToast({
      message: this.t('Toasts.WebSocketConnectionSuccess'),
      type: 'success',
      duration: 3000,
      tag: 'websocket-connection-success',
    })
    if (this.ws) {
      this.sendSessionUpdate()
    }
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
  }

  private removeToast() {
    toastStore.getState().removeToast('websocket-connection-error')
    toastStore.getState().removeToast('websocket-connection-close')
    toastStore.getState().removeToast('websocket-connection-info')
  }

  public sendFunctionCallOutput(
    callId: string,
    output: Record<string, unknown>
  ) {
    const response = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(output),
      },
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(response))
      this.ws.send(
        JSON.stringify({
          type: 'response.create',
        })
      )
    } else {
      console.error('WebSocket is not open. Cannot send function call output.')
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.setStreaming(false)
    }
  }

  public get websocket(): WebSocket | null {
    return this.ws
  }

  public get streaming(): boolean {
    return this.isStreaming
  }

  private setStreaming(value: boolean) {
    this.isStreaming = value
  }

  private async handleMessageType(jsonData: any, type: string): Promise<void> {
    switch (type) {
      case 'error':
        console.log('Received error data', jsonData)
        break
      case 'conversation.item.created':
        console.log('Received context data', jsonData)
        break
      case 'response.audio.delta':
        if (jsonData.delta) {
          const arrayBuffer = base64ToArrayBuffer(jsonData.delta)
          if (arrayBuffer.byteLength > 0) {
            this.accumulatedAudioDataRef.current.addData(arrayBuffer)
          } else {
            console.error('Received invalid audio buffer')
          }
        }
        break
      case 'response.content_part.done':
        if (jsonData.part && jsonData.part.transcript) {
          this.setStreaming(true)
          await this.processMessage({
            text: jsonData.part.transcript,
            role: 'assistant',
            emotion: '',
            type: type,
          })
        }
        break
      case 'conversation.item.input_audio_transcription.completed':
        console.log('Audio data transcription completed', jsonData)
        break
      case 'response.function_call_arguments.done':
        await this.handleFunctionCall(jsonData)
        break
      case 'response.audio.done':
        this.setStreaming(false)
        await this.accumulatedAudioDataRef.current.flush()
        break
      case 'start':
        console.log('Starting new response')
        this.setStreaming(false)
        break
      case 'end':
        console.log('Response ended')
        this.setStreaming(false)
        break
    }
  }

  private async handleFunctionCall(jsonData: any) {
    if (jsonData.name && jsonData.arguments && jsonData.call_id) {
      const { name: funcName, arguments: argsString, call_id } = jsonData
      let toastId: string | null = null
      try {
        const args = JSON.parse(argsString)
        if (funcName in RealtimeAPITools) {
          console.log(`Executing function ${funcName}`)
          toastId = toastStore.getState().addToast({
            message: this.t('Toasts.FunctionExecuting', { funcName }),
            type: 'info',
            duration: 120000,
            tag: `run-${funcName}`,
          })
          const result = await (RealtimeAPITools as any)[funcName](
            ...Object.values(args)
          )
          this.sendFunctionCallOutput(call_id, result)
          if (toastId) {
            toastStore.getState().removeToast(toastId)
          }
        } else {
          console.log(
            `Error: Function ${funcName} is not defined in RealtimeAPITools`
          )
        }
      } catch (error) {
        console.error('Error parsing function arguments:', error)
        if (toastId) {
          toastStore.getState().removeToast(toastId)
        }
        toastId = toastStore.getState().addToast({
          message: this.t('Toasts.FunctionExecutionFailed', { funcName }),
          type: 'error',
          duration: 3000,
          tag: `run-${funcName}`,
        })
      }
    }
  }

  public reconnect(): boolean {
    const ss = settingsStore.getState()
    if (!ss.realtimeAPIMode || !ss.selectAIService) return false

    this.disconnect()
    this.connect()

    return true
  }
}
