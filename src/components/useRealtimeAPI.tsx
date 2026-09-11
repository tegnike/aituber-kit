import { isDemoMode } from '@/utils/demoMode'
import { logger } from '@/lib/logger'
import { useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { SessionConfig, TmpMessage } from './realtimeAPIUtils'
import webSocketStore from '@/features/stores/websocketStore'
import { base64ToArrayBuffer } from './realtimeAPIUtils'
import { RealtimeAPIModeModel } from '@/features/constants/settings'
import { defaultModels } from '@/features/constants/aiModels'
import RealtimeAPITools from './realtimeAPITools'
import RealtimeAPIToolsJson from './realtimeAPITools.json'
import { AudioBufferManager } from '@/utils/audioBufferManager'
import toastStore from '@/features/stores/toast'
import { resetSessionId } from '@/utils/sessionId'

// Realtime APIのサーバーイベント（各typeごとに関連プロパティのみ使用するため緩やかな形にする）
interface RealtimeServerEvent {
  type?: string
  delta?: string
  part?: { transcript?: string }
  transcript?: string
  response_id?: string
  item_id?: string
  content_index?: number
  name?: string
  arguments?: string
  call_id?: string
  [key: string]: unknown
}

// RealtimeAPITools内の呼び出し可能な関数の型
type RealtimeAPIToolFunction = (...args: unknown[]) => Promise<string>

interface Params {
  handleReceiveTextFromRt: (
    text: string,
    role?: string,
    type?: string,
    buffer?: ArrayBuffer
  ) => Promise<void>
}

const REALTIME_CLIENT_SECRET_TIMEOUT_MS = 10000

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
  const processedTranscriptKeysRef = useRef(new Set<string>())

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
    (callId: string, output: unknown) => {
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
          logger.error(
            'WebSocket is not open. Cannot send function call output.'
          )
        }
      }
    },
    []
  )

  const handleFunctionCall = useCallback(
    async (jsonData: RealtimeServerEvent) => {
      if (jsonData.name && jsonData.arguments && jsonData.call_id) {
        const { name: funcName, arguments: argsString, call_id } = jsonData
        let toastId: string | null = null
        try {
          const args = JSON.parse(argsString)
          const functionDef = RealtimeAPIToolsJson.find(
            (tool) => tool.name === funcName
          )
          if (functionDef) {
            logger.log(`Executing function ${funcName}`)
            toastId = toastStore.getState().addToast({
              message: t('Toasts.FunctionExecuting', { funcName }),
              type: 'info',
              duration: 120000,
              tag: `run-${funcName}`,
            })
            const toolFunction = (
              RealtimeAPITools as unknown as Record<
                string,
                RealtimeAPIToolFunction
              >
            )[funcName]
            const result = await toolFunction(...Object.values(args))
            sendFunctionCallOutput(call_id, result)
            if (toastId) {
              toastStore.getState().removeToast(toastId)
            }
          } else {
            logger.error(
              `Error: Function ${funcName} is not defined in RealtimeAPITools`
            )
          }
        } catch (error) {
          logger.error('Error parsing function arguments:', error)
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
    async (jsonData: RealtimeServerEvent, type: string) => {
      const wsManager = webSocketStore.getState().wsManager

      logger.log('Received message type:', type)

      switch (type) {
        case 'error':
          logger.error('Received error data', jsonData)
          break
        case 'conversation.item.created':
        case 'conversation.item.added':
          logger.log('Received context data', jsonData)
          break
        case 'response.audio.delta':
        case 'response.output_audio.delta':
          if (jsonData.delta) {
            const arrayBuffer = base64ToArrayBuffer(jsonData.delta)
            if (arrayBuffer.byteLength > 0) {
              accumulatedAudioDataRef.current.addData(arrayBuffer)
            } else {
              logger.error('Received invalid audio buffer')
            }
          }
          break
        case 'response.output_audio_transcript.done':
          if (jsonData.transcript) {
            const transcriptKey =
              jsonData.response_id && jsonData.item_id
                ? `${jsonData.response_id}:${jsonData.item_id}:${jsonData.content_index ?? 0}`
                : jsonData.transcript
            if (processedTranscriptKeysRef.current.has(transcriptKey)) break
            processedTranscriptKeysRef.current.add(transcriptKey)
            await processMessage({
              text: jsonData.transcript,
              role: 'assistant',
              emotion: '',
              type: type,
            })
          }
          break
        case 'response.content_part.done':
          if (jsonData.part && jsonData.part.transcript) {
            const transcriptKey =
              jsonData.response_id && jsonData.item_id
                ? `${jsonData.response_id}:${jsonData.item_id}:${jsonData.content_index ?? 0}`
                : jsonData.part.transcript
            if (processedTranscriptKeysRef.current.has(transcriptKey)) break
            processedTranscriptKeysRef.current.add(transcriptKey)
            await processMessage({
              text: jsonData.part.transcript,
              role: 'assistant',
              emotion: '',
              type: type,
            })
          }
          break
        case 'conversation.item.input_audio_transcription.completed':
          logger.log('Audio data transcription completed', jsonData)
          break
        case 'response.function_call_arguments.done':
          await handleFunctionCall(jsonData)
          break
        case 'response.audio.done':
        case 'response.output_audio.done':
          await accumulatedAudioDataRef.current.flush()
          break
        case 'response.done':
          processedTranscriptKeysRef.current.clear()
          break
      }
    },
    [
      accumulatedAudioDataRef,
      handleFunctionCall,
      processMessage,
      processedTranscriptKeysRef,
    ]
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
          type: 'realtime',
          output_modalities: ['audio'],
          instructions: ss.systemPrompt,
          audio: {
            input: {
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              transcription: {
                model: 'whisper-1',
              },
              turn_detection: null,
            },
            output: {
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              voice: ss.realtimeAPIModeVoice,
            },
          },
        },
      }

      // realtimeAPITools.jsonからツール情報を取得
      if (RealtimeAPIToolsJson && RealtimeAPIToolsJson.length > 0) {
        wsConfig.session.tools = RealtimeAPIToolsJson
        wsConfig.session.tool_choice = 'auto'
      }

      const wsConfigString = JSON.stringify(wsConfig)
      wsManager.websocket.send(wsConfigString)
    }
  }, [])

  const onMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const jsonData: RealtimeServerEvent = JSON.parse(event.data)
        const type = jsonData.type || ''
        await handleMessageType(jsonData, type)
      } catch (error) {
        logger.error('Error handling message:', error)
      }
    },
    [handleMessageType]
  )

  const onOpen = useCallback(
    (event: Event) => {
      homeStore.setState({ chatLog: [] })
      processedTranscriptKeysRef.current.clear()
      resetSessionId()
      sendSessionUpdate()
    },
    [sendSessionUpdate]
  )

  const onError = useCallback((event: Event) => {}, [])

  const onClose = useCallback((event: Event) => {}, [])

  const connectWebsocket = async (): Promise<WebSocket | null> => {
    if (isDemoMode()) return null
    const wsManager = webSocketStore.getState().wsManager
    if (wsManager?.isConnected()) return wsManager.websocket

    const ss = settingsStore.getState()
    if (!ss.selectAIService) return null

    let ws: WebSocket | null = null
    if (ss.selectAIService === 'openai') {
      const model: RealtimeAPIModeModel =
        (ss.selectAIModel as RealtimeAPIModeModel) ||
        defaultModels.openaiRealtime
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        REALTIME_CLIENT_SECRET_TIMEOUT_MS
      )
      let tokenResponse: Response
      try {
        tokenResponse = await fetch('/api/ai/realtime-client-secret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: ss.openaiKey,
            model,
          }),
          signal: controller.signal,
        })
      } catch (error) {
        logger.error('Failed to fetch OpenAI Realtime client secret:', error)
        return null
      } finally {
        clearTimeout(timeoutId)
      }
      const tokenData = (await tokenResponse.json().catch(() => ({}))) as {
        value?: string
        error?: string
      }
      if (!tokenResponse.ok || !tokenData.value) {
        logger.error(
          'Failed to create OpenAI Realtime client secret:',
          tokenData.error || tokenResponse.statusText
        )
        return null
      }
      const url = `wss://api.openai.com/v1/realtime?model=${model}`
      ws = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${tokenData.value}`,
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

    let reconnectInterval: ReturnType<typeof setInterval> | null = null
    const handlers = {
      onOpen: onOpen,
      onMessage: onMessage,
      onError: onError,
      onClose: onClose,
    }

    const connectTimer = setTimeout(() => {
      webSocketStore
        .getState()
        .initializeWebSocket(t, handlers, connectWebsocket)

      reconnectInterval = setInterval(() => {
        const ss = settingsStore.getState()
        const wsManager = webSocketStore.getState().wsManager
        if (
          ss.realtimeAPIMode &&
          wsManager &&
          (!wsManager.websocket ||
            (wsManager.websocket.readyState !== WebSocket.OPEN &&
              wsManager.websocket.readyState !== WebSocket.CONNECTING))
        ) {
          homeStore.setState({ chatProcessing: false })
          logger.log('try reconnecting...')
          wsManager.disconnect()
          webSocketStore
            .getState()
            .initializeWebSocket(t, handlers, connectWebsocket)
        }
      }, 2000)
    }, 100)

    return () => {
      clearTimeout(connectTimer)
      if (reconnectInterval) clearInterval(reconnectInterval)
      webSocketStore.getState().disconnect()
    }
  }, [realtimeAPIMode, processMessage, t, onOpen, onMessage, onError, onClose])

  return null
}

export default useRealtimeAPI
