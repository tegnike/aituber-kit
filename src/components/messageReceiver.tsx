import { logger } from '@/lib/logger'
import { useEffect, useState, useCallback } from 'react'
import {
  speakMessageHandler,
  processAIResponse,
  handleSendChatFn,
} from '@/features/chat/handlers'
import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'
import { Message } from '@/features/messages/messages'
import { useRestrictedMode } from '@/hooks/useRestrictedMode'
import { SpeakQueue } from '@/features/messages/speakQueue'
import type {
  PresentationAssignment,
  PresentationControlAction,
  PresentationControlTarget,
} from '@/features/presentation/presentationTypes'
import { normalizeExternalPresentation } from '@/features/presentation/presentationNormalizer'
import presentationStore, {
  applyPresentationControl,
  getPresentationActualState,
  loadPresentationDocument,
  setPresentationError,
  setPresentationLoading,
  unloadPresentation,
} from '@/features/stores/presentation'
import slideStore from '@/features/stores/slide'
import menuStore from '@/features/stores/menu'

class ReceivedMessage {
  timestamp: number
  message: string
  type: 'direct_send' | 'ai_generate' | 'user_input'
  systemPrompt?: string
  useCurrentSystemPrompt?: boolean
  image?: string

  constructor(
    timestamp: number,
    message: string,
    type: 'direct_send' | 'ai_generate' | 'user_input',
    systemPrompt?: string,
    useCurrentSystemPrompt?: boolean,
    image?: string
  ) {
    this.timestamp = timestamp
    this.message = message
    this.type = type
    this.systemPrompt = systemPrompt
    this.useCurrentSystemPrompt = useCurrentSystemPrompt
    this.image = image
  }
}

type ReceivedStopCommand = {
  id: string
  command: 'stop'
  mode: 'speech' | 'queue' | 'all'
  reason?: string
}

type ReceivedPresentationCommand =
  | {
      id: string
      command: 'presentation.load'
      presentationId: string
      revision: number
    }
  | {
      id: string
      command: 'presentation.control'
      action: PresentationControlAction
      target?: PresentationControlTarget
      speak?: boolean
    }

type ReceivedCommand = ReceivedStopCommand | ReceivedPresentationCommand

const getClientApiHeaders = () => {
  const apiKey = process.env.NEXT_PUBLIC_AITUBERKIT_API_KEY
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : null
}

const MessageReceiver = () => {
  const [lastTimestamp, setLastTimestamp] = useState(0)
  const clientId = settingsStore((state) => state.clientId)
  const { isRestrictedMode } = useRestrictedMode()
  const handleSendChat = handleSendChatFn()

  const speakMessage = useCallback(
    async (messages: ReceivedMessage[]) => {
      const hs = homeStore.getState()
      const ss = settingsStore.getState()

      for (const message of messages) {
        switch (message.type) {
          case 'direct_send':
            await speakMessageHandler(message.message)
            break
          case 'ai_generate': {
            // 外部画像が提供された場合はそれを使用、なければカメラキャプチャ
            let capturedImage = message.image || ''

            if (!capturedImage) {
              const CAPTURE_TIMEOUT = 10000 // 10秒のタイムアウト

              try {
                // キャプチャをトリガー
                if (!hs.modalImage) {
                  homeStore.setState({ triggerShutter: true })
                }

                // webcamStatusまたはcaptureStatusがtrueの場合、画像が取得されるまで待機
                if (hs.webcamStatus || hs.captureStatus) {
                  // 画像が取得されるまで待つ
                  let checkImage: ReturnType<typeof setInterval> | undefined
                  capturedImage = await Promise.race([
                    new Promise<string>((resolve) => {
                      checkImage = setInterval(() => {
                        const currentModalImage =
                          homeStore.getState().modalImage
                        if (currentModalImage) {
                          clearInterval(checkImage)
                          resolve(currentModalImage)
                        }
                      }, 100)
                    }),
                    new Promise<string>((_, reject) =>
                      setTimeout(() => {
                        if (checkImage) clearInterval(checkImage)
                        reject(new Error('Image capture timeout'))
                      }, CAPTURE_TIMEOUT)
                    ),
                  ])
                } else {
                  // 既存の modalImage があれば使用
                  capturedImage = hs.modalImage || ''
                }
              } catch (error) {
                logger.error('Failed to capture image:', error)
                // エラー時は画像なしで続行
                capturedImage = ''
              }
            }

            const conversationHistory = [
              ...hs.chatLog.slice(-10),
              { role: 'user', content: message.message },
            ]
              .map((m) => `${m.role}: ${m.content}`)
              .join('\n')
            const systemPrompt = message.useCurrentSystemPrompt
              ? ss.systemPrompt
              : message.systemPrompt
            const messages: Message[] = [
              {
                role: 'system',
                content: systemPrompt?.replace(
                  '[conversation_history]',
                  conversationHistory
                ),
              },
              {
                role: 'user',
                content: capturedImage
                  ? [
                      { type: 'text', text: message.message },
                      { type: 'image', image: capturedImage },
                    ]
                  : message.message,
              },
            ]

            // 画像を使用した後にクリア
            if (capturedImage) {
              homeStore.setState({ modalImage: '' })
            }

            await processAIResponse(messages)
            break
          }
          case 'user_input': {
            if (message.image) {
              // 外部画像をmodalImageにセット
              homeStore.setState({ modalImage: message.image })
            } else {
              const CAPTURE_TIMEOUT = 10000 // 10秒のタイムアウト

              try {
                // キャプチャをトリガー
                if (!hs.modalImage) {
                  homeStore.setState({ triggerShutter: true })
                }

                // webcamStatusまたはcaptureStatusがtrueの場合、画像が取得されるまで待機
                if (hs.webcamStatus || hs.captureStatus) {
                  // 画像が取得されるまで待つ
                  let checkImage: ReturnType<typeof setInterval> | undefined
                  await Promise.race([
                    new Promise<string>((resolve) => {
                      checkImage = setInterval(() => {
                        const currentModalImage =
                          homeStore.getState().modalImage
                        if (currentModalImage) {
                          clearInterval(checkImage)
                          resolve(currentModalImage)
                        }
                      }, 100)
                    }),
                    new Promise<string>((_, reject) =>
                      setTimeout(() => {
                        if (checkImage) clearInterval(checkImage)
                        reject(new Error('Image capture timeout'))
                      }, CAPTURE_TIMEOUT)
                    ),
                  ])
                }
              } catch (error) {
                logger.error('Failed to capture image:', error)
              }
            }

            // handleSendChatFnを使用してメッセージを送信
            await handleSendChat(message.message)
            break
          }
          default:
            logger.error('Invalid message type:', message.type)
        }
      }
    },
    [handleSendChat]
  )

  useEffect(() => {
    if (!clientId || isRestrictedMode) return

    let loadingPresentationKey: string | null = null
    let autoStartedAssignmentKey: string | null = null

    const loadPresentation = async (
      presentationId: string,
      revision: number,
      autoStart = false
    ) => {
      const key = `${presentationId}:${revision}`
      if (loadingPresentationKey === key) return
      loadingPresentationKey = key
      setPresentationLoading(presentationId, revision)

      try {
        const authHeaders = getClientApiHeaders()
        if (!authHeaders) throw new Error('Client API key is not configured')
        const response = await fetch(
          `/api/v1/presentations/${encodeURIComponent(presentationId)}?revision=${revision}`,
          { headers: authHeaders }
        )
        if (!response.ok) {
          throw new Error(`Presentation load failed (${response.status})`)
        }
        const data = await response.json()
        const document = normalizeExternalPresentation(data.presentation)
        loadPresentationDocument(document, data.contentHash, autoStart)
        settingsStore.setState({ slideMode: true })
        menuStore.setState({ slideVisible: true })
        slideStore.setState({ currentSlide: 0, isPlaying: false })
        if (autoStart) autoStartedAssignmentKey = key
      } catch (error) {
        logger.error('Error loading external presentation:', error)
        setPresentationError(
          error instanceof Error ? error.message : 'Presentation load failed'
        )
      } finally {
        loadingPresentationKey = null
      }
    }

    const reconcileAssignment = async (
      assignment: PresentationAssignment | null
    ) => {
      const current = presentationStore.getState()
      if (!assignment) {
        if (current.presentationId) unloadPresentation()
        return
      }
      const key = `${assignment.presentationId}:${assignment.revision}`
      if (
        !current.document ||
        current.document.presentationId !== assignment.presentationId ||
        current.document.revision !== assignment.revision ||
        current.presentationId !== assignment.presentationId ||
        current.revision !== assignment.revision ||
        current.state === 'error'
      ) {
        await loadPresentation(
          assignment.presentationId,
          assignment.revision,
          assignment.autoStart
        )
      } else if (
        assignment.autoStart &&
        autoStartedAssignmentKey !== key &&
        current.state === 'ready'
      ) {
        applyPresentationControl('start')
        autoStartedAssignmentKey = key
      }
    }

    const reportStatus = async () => {
      const authHeaders = getClientApiHeaders()
      if (!authHeaders) return

      const hs = homeStore.getState()
      const ss = settingsStore.getState()

      try {
        const response = await fetch(
          `/api/v1/client/status/?clientId=${clientId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
            body: JSON.stringify({
              connected: true,
              isSpeaking: hs.isSpeaking,
              chatProcessing: hs.chatProcessing,
              messageReceiverEnabled: ss.messageReceiverEnabled,
              modelType: ss.modelType,
              aiService: ss.selectAIService,
              voiceEngine: ss.selectVoice,
              externalLinkageMode: ss.externalLinkageMode,
              presentation: getPresentationActualState(hs.isSpeaking),
            }),
          }
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        await reconcileAssignment(data.assignment ?? null)
      } catch (error) {
        logger.error('Error reporting client status:', error)
      }
    }

    const fetchCommands = async () => {
      const authHeaders = getClientApiHeaders()
      if (!authHeaders) return

      try {
        const response = await fetch(
          `/api/v1/client/commands/?clientId=${clientId}`,
          { headers: authHeaders }
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        const commands = (data.commands || []) as ReceivedCommand[]
        for (const command of commands) {
          if (command.command === 'stop') {
            if (command.mode === 'speech') {
              SpeakQueue.stopCurrentSpeech()
            } else if (command.mode === 'queue') {
              SpeakQueue.stopQueue()
            } else {
              SpeakQueue.stopAll()
              homeStore.setState({ chatProcessing: false, isSpeaking: false })
            }
          } else if (command.command === 'presentation.load') {
            await loadPresentation(
              command.presentationId,
              command.revision,
              false
            )
          } else if (command.command === 'presentation.control') {
            const applied = applyPresentationControl(
              command.action,
              command.target,
              command.speak
            )
            if (!applied) {
              setPresentationError('Presentation control could not be applied')
            }
          }
        }

        if (commands.length > 0) {
          await reportStatus()
        }
      } catch (error) {
        logger.error('Error fetching commands:', error)
      }
    }

    const fetchMessages = async () => {
      if (!settingsStore.getState().messageReceiverEnabled) return
      try {
        const response = await fetch(
          `/api/messages/?lastTimestamp=${lastTimestamp}&clientId=${clientId}`
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          speakMessage(data.messages)
          const newLastTimestamp =
            data.messages[data.messages.length - 1].timestamp
          setLastTimestamp(newLastTimestamp)
        }
      } catch (error) {
        logger.error('Error fetching messages:', error)
      }
    }

    let isFetchingMessages = false
    let isFetchingCommands = false
    let isReportingStatus = false

    const safeFetchMessages = async () => {
      if (isFetchingMessages) return
      isFetchingMessages = true
      try {
        await fetchMessages()
      } finally {
        isFetchingMessages = false
      }
    }

    const safeFetchCommands = async () => {
      if (isFetchingCommands) return
      isFetchingCommands = true
      try {
        await fetchCommands()
      } finally {
        isFetchingCommands = false
      }
    }

    const safeReportStatus = async () => {
      if (isReportingStatus) return
      isReportingStatus = true
      try {
        await reportStatus()
      } finally {
        isReportingStatus = false
      }
    }

    void safeFetchCommands()
    void safeFetchMessages()
    void safeReportStatus()
    const commandIntervalId = setInterval(() => void safeFetchCommands(), 1000)
    const intervalId = setInterval(() => void safeFetchMessages(), 1000)
    const statusIntervalId = setInterval(() => void safeReportStatus(), 2000)

    return () => {
      clearInterval(intervalId)
      clearInterval(commandIntervalId)
      clearInterval(statusIntervalId)
    }
  }, [clientId, isRestrictedMode, lastTimestamp, speakMessage])

  return <></>
}

export default MessageReceiver
