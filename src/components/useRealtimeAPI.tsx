import { useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { SessionConfig, TmpMessage } from './realtimeAPIUtils'
import webSocketStore from '@/features/stores/websocketStore'
import { base64ToArrayBuffer } from './realtimeAPIUtils'
import { RealtimeAPIModeModel } from '@/features/constants/settings'
import RealtimeAPITools from './realtimeAPITools'
import RealtimeAPIToolsJson from './realtimeAPITools.json'
import { AudioBufferManager } from '@/utils/audioBufferManager'
import toastStore from '@/features/stores/toast'

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
  const accumulatedAudioDataRef = useRef(
    new AudioBufferManager(async (buffer) => {
      await processMessage({
        text: '',
        role: 'assistant',
        emotion: '',
        type: 'response.audio',
        buffer: buffer,
      })
    })
  )

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

  const sendFunctionCallOutput = useCallback(
    (callId: string, output: Record<string, unknown>) => {
      const wsManager = webSocketStore.getState().wsManager
      if (wsManager) {
        const response = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: callId,
            output: JSON.stringify(output),
          },
        }

        if (wsManager.websocket?.readyState === WebSocket.OPEN) {
          wsManager.websocket.send(JSON.stringify(response))
          wsManager.websocket.send(
            JSON.stringify({
              type: 'response.create',
            })
          )
        } else {
          console.error(
            'WebSocket is not open. Cannot send function call output.'
          )
        }
      }
    },
    []
  )

  const handleFunctionCall = useCallback(
    async (jsonData: any) => {
      if (jsonData.name && jsonData.arguments && jsonData.call_id) {
        const { name: funcName, arguments: argsString, call_id } = jsonData
        let toastId: string | null = null
        try {
          const args = JSON.parse(argsString)
          const functionDef = RealtimeAPIToolsJson.find(
            (tool) => tool.name === funcName
          )
          if (functionDef) {
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
            sendFunctionCallOutput(call_id, result)
            if (toastId) {
              toastStore.getState().removeToast(toastId)
            }
          } else {
            console.error(
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
    },
    [t, sendFunctionCallOutput]
  )

  const handleMessageType = useCallback(
    async (jsonData: any, type: string) => {
      const wsManager = webSocketStore.getState().wsManager

      console.log('Received message type:', type)

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
              accumulatedAudioDataRef.current.addData(arrayBuffer)
            } else {
              console.error('Received invalid audio buffer')
            }
          }
          break
        case 'response.content_part.done':
          if (jsonData.part && jsonData.part.transcript) {
            await processMessage({
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
          await handleFunctionCall(jsonData)
          break
        case 'response.audio.done':
          await accumulatedAudioDataRef.current.flush()
          break
      }
    },
    [accumulatedAudioDataRef, handleFunctionCall, processMessage]
  )

  const sendSessionUpdate = useCallback(() => {
    const ss = settingsStore.getState()
    const wsManager = webSocketStore.getState().wsManager
    if (
      wsManager?.websocket &&
      wsManager.websocket.readyState === WebSocket.OPEN
    ) {
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
      if (RealtimeAPIToolsJson && RealtimeAPIToolsJson.length > 0) {
        ;(wsConfig.session as any).tools = RealtimeAPIToolsJson
        ;(wsConfig.session as any).tool_choice = 'auto'
      }

      const wsConfigString = JSON.stringify(wsConfig)
      wsManager.websocket.send(wsConfigString)
    }
  }, [])

  const onMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const jsonData = JSON.parse(event.data)
        const type = jsonData.type || ''
        await handleMessageType(jsonData, type)
      } catch (error) {
        console.error('Error handling message:', error)
      }
    },
    [handleMessageType]
  )

  const onOpen = useCallback(
    (event: Event) => {
      homeStore.setState({ chatLog: [] })
      sendSessionUpdate()
    },
    [sendSessionUpdate]
  )

  const onError = useCallback((event: Event) => {}, [])

  const onClose = useCallback((event: Event) => {}, [])

  const connectWebsocket: () => WebSocket | null = () => {
    const wsManager = webSocketStore.getState().wsManager
    if (wsManager?.isConnected()) return wsManager.websocket

    const ss = settingsStore.getState()
    if (!ss.selectAIService) return null

    let ws: WebSocket | null = null
    if (ss.selectAIService === 'openai') {
      const model: RealtimeAPIModeModel =
        (ss.selectAIModel as RealtimeAPIModeModel) || 'gpt-4o-realtime-preview'
      const url = `wss://api.openai.com/v1/realtime?model=${model}`
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

  useEffect(() => {
    const ss = settingsStore.getState()
    if (!ss.realtimeAPIMode || !ss.selectAIService) return

    const handlers = {
      onOpen: onOpen,
      onMessage: onMessage,
      onError: onError,
      onClose: onClose,
    }

    webSocketStore.getState().initializeWebSocket(t, handlers, connectWebsocket)

    const wsManager = webSocketStore.getState().wsManager

    const reconnectInterval = setInterval(() => {
      const ss = settingsStore.getState()
      if (
        ss.realtimeAPIMode &&
        wsManager?.websocket &&
        wsManager.websocket.readyState !== WebSocket.OPEN &&
        wsManager.websocket.readyState !== WebSocket.CONNECTING
      ) {
        homeStore.setState({ chatProcessing: false })
        console.log('try reconnecting...')
        wsManager.disconnect()
        webSocketStore
          .getState()
          .initializeWebSocket(t, handlers, connectWebsocket)
      }
    }, 2000)

    return () => {
      clearInterval(reconnectInterval)
      webSocketStore.getState().disconnect()
    }
  }, [realtimeAPIMode, processMessage, t, onOpen, onMessage, onError, onClose])

  return null
}

export default useRealtimeAPI
