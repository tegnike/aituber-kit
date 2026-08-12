import { logger } from '@/lib/logger'
import { useCallback, useEffect, useRef } from 'react'
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
import type { QueuedResponseCallback } from '@/features/api/messageGateway'
import {
  canClaimClientTabLease,
  createClientTabId,
  parseClientTabLease,
} from '@/features/api/clientTabLeadership'
import {
  createReceiverDescriptor,
  getReceiverCapabilities,
} from '@/features/api/receiverRegistry'
import {
  createOrderedReceiverDrainRunner,
  subscribeReceiverEventStream,
} from '@/features/api/receiverEventStream'
import { createAssignmentReconciliationRunner } from '@/features/presentation/assignmentReconciliation'
import { createActiveSpeechReporter } from '@/features/api/activeSpeechReporter'

const CLIENT_TAB_LEASE_DURATION = 5000
const CLIENT_TAB_LEASE_REFRESH_INTERVAL = 2000
const DISCONNECTED_FALLBACK_POLL_INTERVAL = 1000
const CONNECTED_SAFETY_POLL_INTERVAL = 15000

class ReceivedMessage {
  timestamp: number
  message: string
  type: 'direct_send' | 'ai_generate' | 'user_input'
  systemPrompt?: string
  useCurrentSystemPrompt?: boolean
  image?: string
  speechSessionId?: string
  responseCallback?: QueuedResponseCallback

  constructor(
    timestamp: number,
    message: string,
    type: 'direct_send' | 'ai_generate' | 'user_input',
    systemPrompt?: string,
    useCurrentSystemPrompt?: boolean,
    image?: string,
    speechSessionId?: string,
    responseCallback?: QueuedResponseCallback
  ) {
    this.timestamp = timestamp
    this.message = message
    this.type = type
    this.systemPrompt = systemPrompt
    this.useCurrentSystemPrompt = useCurrentSystemPrompt
    this.image = image
    this.speechSessionId = speechSessionId
    this.responseCallback = responseCallback
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
  const lastTimestampsRef = useRef<Record<string, number>>({})
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
            await speakMessageHandler(message.message, message.speechSessionId)
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

            homeStore.getState().upsertMessage({
              role: 'user',
              content: message.message,
              timestamp: new Date().toISOString(),
            })
            try {
              const content = await processAIResponse(messages)
              if (message.responseCallback) {
                await reportResponseCallback(
                  message.responseCallback,
                  content
                    ? { status: 'completed', content }
                    : { status: 'empty' }
                )
              }
            } catch (error) {
              if (message.responseCallback) {
                try {
                  await reportResponseCallback(message.responseCallback, {
                    status: 'failed',
                    error:
                      error instanceof Error ? error.message : 'UNKNOWN_ERROR',
                  })
                } catch (callbackError) {
                  logger.error(
                    'Failed to report AI response error:',
                    callbackError
                  )
                }
              }
              logger.error('Failed to process received AI message:', error)
            }
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

    const loadingPresentationKeys = new Set<string>()
    let autoStartedAssignmentKey: string | null = null
    let failedPresentationKey: string | null = null
    let presentationRetryAttempt = 0
    let presentationRetryAfter = 0
    const receiverStorageKey = `aituber-kit-receiver:${clientId}`
    let tabId = createClientTabId()
    try {
      const storedTabId = window.sessionStorage.getItem(receiverStorageKey)
      if (storedTabId) {
        tabId = storedTabId
      } else {
        window.sessionStorage.setItem(receiverStorageKey, tabId)
      }
    } catch {
      // OBSなどsessionStorageが制限される環境では一時IDを使用する。
    }
    const receiver = createReceiverDescriptor(
      clientId,
      tabId,
      navigator.userAgent,
      settingsStore.getState().messageReceiverEnabled
    )
    const {
      receiverId,
      displayName: receiverDisplayName,
      kind: receiverKind,
    } = receiver
    const leaseKey = `aituber-kit-client-tab-leader:${clientId}`
    let isClientTabLeader = false
    let receiverHasAssignment = false

    const readClientTabLease = () => {
      try {
        return parseClientTabLease(window.localStorage.getItem(leaseKey))
      } catch {
        return null
      }
    }

    const writeClientTabLease = () => {
      try {
        window.localStorage.setItem(
          leaseKey,
          JSON.stringify({
            tabId,
            expiresAt: Date.now() + CLIENT_TAB_LEASE_DURATION,
          })
        )
        isClientTabLeader = true
      } catch {
        // Storageが使えない環境では従来どおりこのTabを有効にする。
        isClientTabLeader = true
      }
    }

    const releaseClientTabLease = () => {
      if (!isClientTabLeader) return
      try {
        if (readClientTabLease()?.tabId === tabId) {
          window.localStorage.removeItem(leaseKey)
        }
      } catch {
        // Cleanup時のStorage例外は無視する。
      }
      isClientTabLeader = false
    }

    const loadPresentation = async (
      presentationId: string,
      revision: number,
      autoStart = false
    ) => {
      const key = `${presentationId}:${revision}`
      if (loadingPresentationKeys.has(key)) return
      loadingPresentationKeys.add(key)
      const loadGeneration = setPresentationLoading(presentationId, revision)

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
        const committed = loadPresentationDocument(
          document,
          data.contentHash,
          autoStart,
          loadGeneration
        )
        if (!committed) return
        settingsStore.setState({ slideMode: true })
        menuStore.setState({ slideVisible: autoStart, thumbnailVisible: false })
        slideStore.setState({ currentSlide: 0, isPlaying: false })
        if (autoStart) autoStartedAssignmentKey = key
        failedPresentationKey = null
        presentationRetryAttempt = 0
        presentationRetryAfter = 0
      } catch (error) {
        logger.error('Error loading external presentation:', error)
        if (
          setPresentationError(
            error instanceof Error ? error.message : 'Presentation load failed',
            loadGeneration
          )
        ) {
          presentationRetryAttempt =
            failedPresentationKey === key ? presentationRetryAttempt + 1 : 1
          failedPresentationKey = key
          presentationRetryAfter =
            Date.now() +
            Math.min(60_000, 2_000 * 2 ** (presentationRetryAttempt - 1))
        }
      } finally {
        loadingPresentationKeys.delete(key)
      }
    }

    const reconcileAssignment = async (
      assignment: PresentationAssignment | null
    ) => {
      const current = presentationStore.getState()
      if (!assignment) {
        if (current.presentationId) unloadPresentation()
        failedPresentationKey = null
        presentationRetryAttempt = 0
        presentationRetryAfter = 0
        return
      }
      const key = `${assignment.presentationId}:${assignment.revision}`
      if (
        current.state === 'error' &&
        failedPresentationKey === key &&
        Date.now() < presentationRetryAfter
      ) {
        return
      }
      if (
        !current.document ||
        current.document.presentationId !== assignment.presentationId ||
        current.document.revision !== assignment.revision ||
        current.presentationId !== assignment.presentationId ||
        current.revision !== assignment.revision ||
        current.state === 'loading' ||
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

    const scheduleAssignmentReconciliation =
      createAssignmentReconciliationRunner(reconcileAssignment, (error) =>
        logger.error('Error reconciling presentation assignment:', error)
      )

    const reportStatus = async (
      targetId: string,
      mode: 'receiver' | 'legacy'
    ) => {
      if (mode === 'legacy' && !isClientTabLeader) return
      const authHeaders = getClientApiHeaders()
      if (!authHeaders) return

      const hs = homeStore.getState()
      const ss = settingsStore.getState()

      try {
        const response = await fetch(
          `/api/v1/client/status/?receiverId=${encodeURIComponent(targetId)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
            body: JSON.stringify({
              ...(mode === 'receiver'
                ? {
                    configuredClientId: clientId,
                    receiverDisplayName,
                    receiverKind,
                    receiverCapabilities: getReceiverCapabilities(
                      ss.messageReceiverEnabled
                    ),
                  }
                : {
                    configuredClientId: clientId,
                    receiverDisplayName: 'AITuberKit legacy receiver',
                    receiverKind: 'legacy',
                    receiverCapabilities: getReceiverCapabilities(
                      ss.messageReceiverEnabled
                    ),
                  }),
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
        if (mode === 'legacy' && !isClientTabLeader) return
        if (data.assignmentError) {
          logger.error(
            'Error reading presentation assignment:',
            data.assignmentError
          )
          return
        }
        const assignment = data.assignment ?? null
        if (mode === 'receiver') {
          const previouslyAssigned = receiverHasAssignment
          receiverHasAssignment = Boolean(assignment)
          if (assignment || previouslyAssigned) {
            // Assignment loading can take several seconds. Keep only the
            // latest assignment in a separate serial drain so activeSpeech
            // reports are not delayed and autoStart/unload updates are kept.
            scheduleAssignmentReconciliation(assignment)
          }
        } else if (!receiverHasAssignment) {
          scheduleAssignmentReconciliation(assignment)
        }
      } catch (error) {
        logger.error('Error reporting client status:', error)
      }
    }

    const reportActiveSpeech = async (
      activeSpeech: { id: string; text: string } | null
    ) => {
      const authHeaders = getClientApiHeaders()
      if (!authHeaders) return
      let lastError: Error | null = null
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetch(
            `/api/v1/client/speech-status/?receiverId=${encodeURIComponent(receiverId)}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
              },
              body: JSON.stringify({ activeSpeech }),
            }
          )
          if (response.ok) return
          lastError = new Error(`HTTP error! status: ${response.status}`)
        } catch (error) {
          lastError =
            error instanceof Error
              ? error
              : new Error('Active speech status request failed')
        }
        if (attempt < 2) {
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * (attempt + 1))
          )
        }
      }
      throw lastError ?? new Error('Active speech status request failed')
    }

    const fetchCommands = async (
      targetId: string,
      mode: 'receiver' | 'legacy'
    ) => {
      if (mode === 'legacy' && (!isClientTabLeader || receiverHasAssignment)) {
        return
      }
      const authHeaders = getClientApiHeaders()
      if (!authHeaders) return

      try {
        const response = await fetch(
          `/api/v1/client/commands/?receiverId=${encodeURIComponent(targetId)}`,
          { headers: authHeaders }
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (mode === 'legacy' && !isClientTabLeader) return
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
            if (!presentationStore.getState().document) {
              await reportStatus(targetId, mode)
            }
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
          await reportStatus(targetId, mode)
        }
      } catch (error) {
        logger.error('Error fetching commands:', error)
      }
    }

    const fetchMessages = async (
      targetId: string,
      mode: 'receiver' | 'legacy'
    ) => {
      if (mode === 'legacy' && (!isClientTabLeader || receiverHasAssignment)) {
        return
      }
      if (!settingsStore.getState().messageReceiverEnabled) return
      const lastTimestamp = lastTimestampsRef.current[targetId] ?? 0
      const authHeaders = mode === 'receiver' ? getClientApiHeaders() : null
      if (mode === 'receiver' && !authHeaders) return
      try {
        const endpoint =
          mode === 'receiver'
            ? `/api/v1/client/messages/?lastTimestamp=${lastTimestamp}&receiverId=${encodeURIComponent(targetId)}`
            : `/api/messages/?lastTimestamp=${lastTimestamp}&clientId=${encodeURIComponent(targetId)}`
        const response = await fetch(
          endpoint,
          authHeaders ? { headers: authHeaders } : undefined
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (mode === 'legacy' && !isClientTabLeader) return
        if (data.messages && data.messages.length > 0) {
          const newLastTimestamp =
            data.messages[data.messages.length - 1].timestamp
          lastTimestampsRef.current[targetId] = newLastTimestamp
          await speakMessage(data.messages)
        }
      } catch (error) {
        logger.error('Error fetching messages:', error)
      }
    }

    let isReportingStatus = false
    let isStatusReportQueued = false
    let activeSpeechReporterReady = false
    const activeSpeechReporter = createActiveSpeechReporter(
      async (activeSpeech) => {
        try {
          await reportActiveSpeech(activeSpeech)
        } catch (error) {
          logger.error('Error reporting active speech status:', error)
        }
      }
    )

    const drainReceiver = createOrderedReceiverDrainRunner({
      fetchCommands: () => fetchCommands(receiverId, 'receiver'),
      fetchMessages: () => fetchMessages(receiverId, 'receiver'),
    })
    const drainLegacyReceiver = createOrderedReceiverDrainRunner({
      fetchCommands: () => fetchCommands(clientId, 'legacy'),
      fetchMessages: () => fetchMessages(clientId, 'legacy'),
    })
    const drainAllReceivers = () =>
      Promise.all([drainReceiver(), drainLegacyReceiver()])
    const drainEventTarget = (targetId: string) => {
      const drains: Promise<void>[] = []
      if (targetId === receiverId) drains.push(drainReceiver())
      if (targetId === clientId) drains.push(drainLegacyReceiver())
      return Promise.all(drains)
    }

    const safeReportStatus = async () => {
      if (!activeSpeechReporterReady) return
      isStatusReportQueued = true
      if (isReportingStatus) return
      isReportingStatus = true
      try {
        while (isStatusReportQueued) {
          isStatusReportQueued = false
          await reportStatus(receiverId, 'receiver')
          await reportStatus(clientId, 'legacy')
        }
      } finally {
        isReportingStatus = false
      }
    }

    const unsubscribePresentationStatus = presentationStore.subscribe(
      (state, previousState) => {
        if (state.updatedAt !== previousState.updatedAt) {
          void safeReportStatus()
        }
      }
    )

    const unsubscribeSpeechStatus = homeStore.subscribe(
      (state, previousState) => {
        if (
          state.isSpeaking !== previousState.isSpeaking ||
          state.activeSpeech?.id !== previousState.activeSpeech?.id
        ) {
          void safeReportStatus()
        }
        if (state.activeSpeech?.id !== previousState.activeSpeech?.id) {
          void activeSpeechReporter.enqueue(state.activeSpeech)
        }
      }
    )

    const claimClientTabLeadership = () => {
      if (document.visibilityState !== 'visible') return
      writeClientTabLease()
      void drainAllReceivers()
      void safeReportStatus()
    }

    const refreshClientTabLeadership = () => {
      const lease = readClientTabLease()
      if (lease?.tabId === tabId) {
        writeClientTabLease()
        return
      }
      isClientTabLeader = false
      if (
        document.visibilityState === 'visible' &&
        canClaimClientTabLease(lease, tabId, Date.now())
      ) {
        claimClientTabLeadership()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') claimClientTabLeadership()
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== leaseKey) return
      isClientTabLeader = parseClientTabLease(event.newValue)?.tabId === tabId
    }

    window.addEventListener('focus', claimClientTabLeadership)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('beforeunload', releaseClientTabLease)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    void drainAllReceivers()
    void activeSpeechReporter
      .enqueue(homeStore.getState().activeSpeech)
      .then(() => {
        activeSpeechReporterReady = true
        return safeReportStatus()
      })

    if (document.visibilityState === 'visible' && document.hasFocus()) {
      claimClientTabLeadership()
    } else {
      refreshClientTabLeadership()
    }

    const eventStreamAbortController = new AbortController()
    const eventStreamTargets = [...new Set([receiverId, clientId])]
    const connectedEventStreamTargets = new Set<string>()
    const eventStreamHeaders = getClientApiHeaders()

    if (eventStreamHeaders) {
      eventStreamTargets.forEach((targetId) => {
        void subscribeReceiverEventStream({
          targetId,
          headers: eventStreamHeaders,
          signal: eventStreamAbortController.signal,
          onWakeup: () => void drainEventTarget(targetId),
          onConnectionChange: (connected) => {
            if (connected) {
              connectedEventStreamTargets.add(targetId)
              // 接続確立直前に追加されたキューとの競合を閉じる。
              void drainEventTarget(targetId)
            } else {
              connectedEventStreamTargets.delete(targetId)
            }
          },
          onError: (error) =>
            logger.error('Receiver event stream disconnected:', error),
        })
      })
    }

    const fallbackIntervalId = setInterval(() => {
      if (
        !eventStreamHeaders ||
        connectedEventStreamTargets.size < eventStreamTargets.length
      ) {
        void drainAllReceivers()
      }
    }, DISCONNECTED_FALLBACK_POLL_INTERVAL)
    const safetyIntervalId = setInterval(() => {
      void drainAllReceivers()
    }, CONNECTED_SAFETY_POLL_INTERVAL)
    const statusIntervalId = setInterval(() => void safeReportStatus(), 2000)
    const leaseIntervalId = setInterval(
      refreshClientTabLeadership,
      CLIENT_TAB_LEASE_REFRESH_INTERVAL
    )

    return () => {
      eventStreamAbortController.abort()
      clearInterval(fallbackIntervalId)
      clearInterval(safetyIntervalId)
      clearInterval(statusIntervalId)
      clearInterval(leaseIntervalId)
      unsubscribePresentationStatus()
      unsubscribeSpeechStatus()
      window.removeEventListener('focus', claimClientTabLeadership)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('beforeunload', releaseClientTabLease)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseClientTabLease()
    }
  }, [clientId, isRestrictedMode, speakMessage])

  return <></>
}

const reportResponseCallback = async (
  callback: QueuedResponseCallback,
  result:
    | { status: 'completed'; content: string }
    | { status: 'empty' }
    | { status: 'failed'; error: string }
) => {
  let lastError: unknown = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const authHeaders = getClientApiHeaders()
      if (!authHeaders) {
        throw new Error('Client API key is not configured')
      }
      const response = await fetch('/api/v1/chat/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          handle: callback.handle,
          ...result,
        }),
      })
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      return
    } catch (error) {
      lastError = error
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  logger.error('Failed to record external chat response:', lastError)
}

export default MessageReceiver
