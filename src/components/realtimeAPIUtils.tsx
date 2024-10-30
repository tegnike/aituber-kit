import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import toastStore from '@/features/stores/toast'
import RealtimeAPITools from './realtimeAPITools'
import realtimeAPIToolsConfig from './realtimeAPITools.json'
import {
  base64ToArrayBuffer,
  AudioBufferManager,
} from '@/utils/audioBufferManager'

export function sendSessionUpdate(ws: WebSocket) {
  const ss = settingsStore.getState()
  if (ws && ws.readyState === WebSocket.OPEN) {
    const wsConfig = {
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
    if (realtimeAPIToolsConfig && realtimeAPIToolsConfig.length > 0) {
      ;(wsConfig.session as any).tools = realtimeAPIToolsConfig
      ;(wsConfig.session as any).tool_choice = 'auto'
    }
    const wsConfigString = JSON.stringify(wsConfig)
    ws.send(wsConfigString)
  }
}

// 型定義
export interface TmpMessage {
  text: string
  role: string
  emotion: string
  state: string
  buffer?: ArrayBuffer
}

export interface Params {
  handleReceiveTextFromRt: (
    text: string,
    role?: string,
    state?: string,
    buffer?: ArrayBuffer
  ) => Promise<void>
}

export function mergeInt16Arrays(
  left: Int16Array | ArrayBuffer,
  right: Int16Array | ArrayBuffer
): Int16Array {
  if (left instanceof ArrayBuffer) {
    left = new Int16Array(left)
  }
  if (right instanceof ArrayBuffer) {
    right = new Int16Array(right)
  }
  if (!(left instanceof Int16Array) || !(right instanceof Int16Array)) {
    throw new Error(`Both items must be Int16Array`)
  }
  const newValues = new Int16Array(left.length + right.length)
  newValues.set(left, 0)
  newValues.set(right, left.length)
  return newValues
}

export function removeToast() {
  toastStore.getState().removeToast('websocket-connection-error')
  toastStore.getState().removeToast('websocket-connection-close')
  toastStore.getState().removeToast('websocket-connection-info')
}

export function sendFunctionCallOutput(
  ws: WebSocket,
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
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(response))
    ws.send(
      JSON.stringify({
        type: 'response.create',
      })
    )
  } else {
    console.error('WebSocket is not open. Cannot send function call output.')
  }
}

export async function handleMessage(
  event: MessageEvent,
  accumulatedAudioDataRef: React.MutableRefObject<AudioBufferManager>,
  processMessage: (message: TmpMessage) => Promise<void>,
  ws: WebSocket,
  t: (key: string, options?: any) => string
) {
  const jsonData = JSON.parse(event.data)
  console.log('Received message:', jsonData.type)

  switch (jsonData.type) {
    case 'error':
      console.log('Received error data', jsonData)
      break
    case 'conversation.item.created':
      console.log('Received context data', jsonData)
      break
    case 'response.audio.delta':
      console.log('Received audio data', jsonData)
      if (jsonData.delta) {
        const arrayBuffer = base64ToArrayBuffer(jsonData.delta)
        if (arrayBuffer.byteLength > 0) {
          accumulatedAudioDataRef.current.addData(arrayBuffer)
        } else {
          console.error('Received invalid audio buffer')
        }
      } else {
        console.error('Received invalid audio buffer')
      }
      break
    case 'response.content_part.done':
      if (jsonData.part && jsonData.part.transcript) {
        await processMessage({
          text: jsonData.part.transcript,
          role: 'assistant',
          emotion: '',
          state: jsonData.type,
        })
      }
      break
    case 'conversation.item.input_audio_transcription.completed':
      console.log('Audio data transcription completed', jsonData)
      break
    case 'response.function_call_arguments.done':
      console.log('Function call arguments completed', jsonData)
      if (jsonData.name && jsonData.arguments && jsonData.call_id) {
        const { name: funcName, arguments: argsString, call_id } = jsonData
        let toastId: string | null = null
        try {
          const args = JSON.parse(argsString)
          if (funcName in RealtimeAPITools) {
            console.log(`Executing function ${funcName}`)
            toastId = toastStore.getState().addToast({
              message: t('Toasts.FunctionExecuting', { funcName }),
              type: 'info',
              duration: 120000,
              tag: `run-${funcName}`,
            })
            const result = await (RealtimeAPITools as any)[funcName](
              ...Object.values(args)
            )
            sendFunctionCallOutput(ws, call_id, result)
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
            message: t('Toasts.FunctionExecutionFailed', { funcName }),
            type: 'error',
            duration: 3000,
            tag: `run-${funcName}`,
          })
        }
      }
      break
    case 'response.audio.done':
      await accumulatedAudioDataRef.current.flush()
      break
  }
}

export function setupWebsocket(
  t: (key: string, options?: any) => string
): WebSocket | null {
  const ss = settingsStore.getState()
  if (!ss.selectAIService) return null

  let ws: WebSocket

  removeToast()
  toastStore.getState().addToast({
    message: t('Toasts.WebSocketConnectionAttempt'),
    type: 'info',
    duration: 10000,
    tag: 'websocket-connection-info',
  })

  if (ss.selectAIService === 'openai') {
    const url =
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01'
    ws = new WebSocket(url, [
      'realtime',
      `openai-insecure-api-key.${ss.openaiKey}`,
      'openai-beta.realtime-v1',
    ])
  } else if (ss.selectAIService === 'azure') {
    const url = `${ss.azureEndpoint}&api-key=${ss.azureKey}`
    ws = new WebSocket(url, [])
  } else {
    return null
  }

  return ws
}

export function reconnectWebSocket(
  t: (key: string, options?: any) => string
): WebSocket | null {
  const ws = homeStore.getState().ws
  if (ws) {
    ws.close()
  }

  const newWs = setupWebsocket(t)
  if (newWs) {
    newWs.addEventListener('open', (event) => {
      console.log('WebSocket connection opened:', event)
      removeToast()
      // chatLogを空配列に初期化
      homeStore.setState({ ws: newWs, chatLog: [] })
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketConnectionSuccess'),
        type: 'success',
        duration: 3000,
        tag: 'websocket-connection-success',
      })
      sendSessionUpdate(newWs)
    })

    newWs.addEventListener('error', (event) => {
      console.error('WebSocket error:', event)
      removeToast()
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketConnectionError'),
        type: 'error',
        duration: 5000,
        tag: 'websocket-connection-error',
      })
    })

    newWs.addEventListener('close', (event) => {
      console.log('WebSocket connection closed:', event)
      removeToast()
      toastStore.getState().addToast({
        message: t('Toasts.WebSocketConnectionClosed'),
        type: 'error',
        duration: 3000,
        tag: 'websocket-connection-close',
      })
    })

    homeStore.setState({ ws: newWs })
  }

  return newWs
}
