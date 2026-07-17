import { logger } from '@/lib/logger'
import type {
  PresentationActualState,
  PresentationControlAction,
  PresentationControlTarget,
} from '@/features/presentation/presentationTypes'

export type MessageType = 'direct_send' | 'ai_generate' | 'user_input'

export type ApiCommandType =
  | 'stop'
  | 'presentation.load'
  | 'presentation.control'

export type ApiStopMode = 'speech' | 'queue' | 'all'

export interface ResponseCallback {
  url: string
  interactionId: string
  token: string
}

export interface QueuedMessage {
  id: string
  timestamp: number
  message: string
  type: MessageType
  systemPrompt?: string
  useCurrentSystemPrompt?: boolean
  image?: string
  emotion?: string
  priority?: 'normal' | 'high'
  interrupt?: boolean
  source?: 'legacy' | 'v1'
  responseCallback?: ResponseCallback
}

export interface QueuedStopCommand {
  id: string
  timestamp: number
  command: 'stop'
  mode: ApiStopMode
  reason?: string
}

export interface QueuedPresentationLoadCommand {
  id: string
  timestamp: number
  command: 'presentation.load'
  presentationId: string
  revision: number
}

export interface QueuedPresentationControlCommand {
  id: string
  timestamp: number
  command: 'presentation.control'
  action: PresentationControlAction
  target?: PresentationControlTarget
  speak?: boolean
}

export type QueuedCommand =
  | QueuedStopCommand
  | QueuedPresentationLoadCommand
  | QueuedPresentationControlCommand

export interface ClientStatus {
  clientId: string
  connected: boolean
  isSpeaking: boolean
  chatProcessing: boolean
  messageReceiverEnabled?: boolean
  modelType?: string
  aiService?: string
  voiceEngine?: string
  externalLinkageMode?: boolean
  presentation?: PresentationActualState
  lastSeenAt: number
}

export interface ApiEvent {
  id: string
  timestamp: number
  clientId: string
  type:
    | 'message_queued'
    | 'messages_fetched'
    | 'stop_requested'
    | 'commands_fetched'
    | 'status_updated'
    | 'presentation_registered'
    | 'presentation_assigned'
    | 'presentation_loaded'
    | 'presentation_started'
    | 'slide_changed'
    | 'section_paused'
    | 'presentation_paused'
    | 'presentation_completed'
    | 'presentation_unloaded'
    | 'presentation_error'
  payload?: Record<string, unknown>
}

interface ClientQueue {
  messages: QueuedMessage[]
  commands: QueuedCommand[]
  lastAccessed: number
}

interface MessageGatewayState {
  queuesPerClient: Record<string, ClientQueue>
  statusesPerClient: Record<string, ClientStatus>
  recentEvents: ApiEvent[]
  eventListeners: Array<(event: ApiEvent) => void>
}

export interface EnqueueMessagesParams {
  clientId: string
  messages: string[]
  type: MessageType
  systemPrompt?: string
  useCurrentSystemPrompt?: boolean
  image?: string
  emotion?: string
  priority?: 'normal' | 'high'
  interrupt?: boolean
  source?: 'legacy' | 'v1'
  responseCallback?: ResponseCallback
}

const CLIENT_TIMEOUT = 1000 * 60 * 5
const RECENT_EVENT_LIMIT = 100

const getGatewayState = (): MessageGatewayState => {
  const globalState = globalThis as typeof globalThis & {
    __aituberKitMessageGateway?: MessageGatewayState
  }

  if (!globalState.__aituberKitMessageGateway) {
    globalState.__aituberKitMessageGateway = {
      queuesPerClient: {},
      statusesPerClient: {},
      recentEvents: [],
      eventListeners: [],
    }
  }

  return globalState.__aituberKitMessageGateway
}

const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

const getOrCreateQueue = (clientId: string): ClientQueue => {
  const state = getGatewayState()

  if (!state.queuesPerClient[clientId]) {
    state.queuesPerClient[clientId] = {
      messages: [],
      commands: [],
      lastAccessed: Date.now(),
    }
  }
  return state.queuesPerClient[clientId]
}

const getQueueIfExists = (clientId: string): ClientQueue | null =>
  getGatewayState().queuesPerClient[clientId] ?? null

export const emitApiEvent = (
  clientId: string,
  type: ApiEvent['type'],
  payload?: Record<string, unknown>
): ApiEvent => {
  const event: ApiEvent = {
    id: createId('evt'),
    timestamp: Date.now(),
    clientId,
    type,
    payload,
  }

  const state = getGatewayState()

  state.recentEvents = [...state.recentEvents, event].slice(-RECENT_EVENT_LIMIT)
  state.eventListeners.forEach((listener) => {
    try {
      listener(event)
    } catch (error) {
      logger.error('API event listener failed:', error)
    }
  })

  return event
}

export const subscribeApiEvents = (listener: (event: ApiEvent) => void) => {
  const state = getGatewayState()

  state.eventListeners.push(listener)

  return () => {
    state.eventListeners = state.eventListeners.filter(
      (item) => item !== listener
    )
  }
}

export const getRecentApiEvents = (clientId?: string) =>
  clientId
    ? getGatewayState().recentEvents.filter(
        (event) => event.clientId === clientId
      )
    : getGatewayState().recentEvents

export const cleanupClientQueues = () => {
  const state = getGatewayState()
  const now = Date.now()
  for (const clientId of Object.keys(state.queuesPerClient)) {
    if (now - state.queuesPerClient[clientId].lastAccessed > CLIENT_TIMEOUT) {
      delete state.queuesPerClient[clientId]
    }
  }
  for (const clientId of Object.keys(state.statusesPerClient)) {
    if (now - state.statusesPerClient[clientId].lastSeenAt > CLIENT_TIMEOUT) {
      delete state.statusesPerClient[clientId]
    }
  }
}

export const enqueueMessages = ({
  clientId,
  messages,
  type,
  systemPrompt,
  useCurrentSystemPrompt,
  image,
  emotion,
  priority = 'normal',
  interrupt = false,
  source = 'v1',
  responseCallback,
}: EnqueueMessagesParams): QueuedMessage[] => {
  cleanupClientQueues()

  const queue = getOrCreateQueue(clientId)
  const timestamp = Date.now()
  const queuedMessages = messages.map((message) => ({
    id: createId('msg'),
    timestamp,
    message,
    type,
    systemPrompt,
    useCurrentSystemPrompt,
    image,
    emotion,
    priority,
    interrupt,
    source,
    responseCallback,
  }))

  if (priority === 'high') {
    queue.messages.unshift(...queuedMessages)
  } else {
    queue.messages.push(...queuedMessages)
  }

  queue.lastAccessed = timestamp
  emitApiEvent(clientId, 'message_queued', {
    count: queuedMessages.length,
    messageType: type,
    source,
    interrupt,
  })

  return queuedMessages
}

export const dequeueMessages = (clientId: string): QueuedMessage[] => {
  const queue = getQueueIfExists(clientId)
  if (!queue) return []

  const messages = queue.messages

  queue.messages = []
  queue.lastAccessed = Date.now()

  if (messages.length > 0) {
    emitApiEvent(clientId, 'messages_fetched', { count: messages.length })
  }

  return messages
}

export const enqueueStopCommand = (
  clientId: string,
  mode: ApiStopMode = 'all',
  reason?: string
): QueuedStopCommand => {
  cleanupClientQueues()

  const queue = getOrCreateQueue(clientId)
  const command: QueuedStopCommand = {
    id: createId('cmd'),
    timestamp: Date.now(),
    command: 'stop',
    mode,
    reason,
  }

  queue.commands.push(command)
  queue.lastAccessed = command.timestamp
  emitApiEvent(clientId, 'stop_requested', { commandId: command.id, mode })

  return command
}

export const enqueuePresentationLoadCommand = (
  clientId: string,
  presentationId: string,
  revision: number
): QueuedPresentationLoadCommand => {
  cleanupClientQueues()
  const queue = getOrCreateQueue(clientId)
  const command: QueuedPresentationLoadCommand = {
    id: createId('cmd'),
    timestamp: Date.now(),
    command: 'presentation.load',
    presentationId,
    revision,
  }
  queue.commands.push(command)
  queue.lastAccessed = command.timestamp
  return command
}

export const enqueuePresentationControlCommand = (
  clientId: string,
  action: PresentationControlAction,
  target?: PresentationControlTarget,
  speak?: boolean
): QueuedPresentationControlCommand => {
  cleanupClientQueues()
  const queue = getOrCreateQueue(clientId)
  const command: QueuedPresentationControlCommand = {
    id: createId('cmd'),
    timestamp: Date.now(),
    command: 'presentation.control',
    action,
    target,
    speak,
  }
  queue.commands.push(command)
  queue.lastAccessed = command.timestamp
  return command
}

export const dequeueCommands = (clientId: string): QueuedCommand[] => {
  const queue = getQueueIfExists(clientId)
  if (!queue) return []

  const commands = queue.commands

  queue.commands = []
  queue.lastAccessed = Date.now()

  if (commands.length > 0) {
    emitApiEvent(clientId, 'commands_fetched', { count: commands.length })
  }

  return commands
}

export const updateClientStatus = (
  clientId: string,
  status: Omit<ClientStatus, 'clientId' | 'lastSeenAt'>
): ClientStatus => {
  const previousStatus = getGatewayState().statusesPerClient[clientId]
  const nextStatus: ClientStatus = {
    ...status,
    clientId,
    lastSeenAt: Date.now(),
  }

  getGatewayState().statusesPerClient[clientId] = nextStatus
  emitApiEvent(clientId, 'status_updated', {
    connected: nextStatus.connected,
    isSpeaking: nextStatus.isSpeaking,
    chatProcessing: nextStatus.chatProcessing,
  })

  const previousPresentation = previousStatus?.presentation
  const presentation = nextStatus.presentation
  if (
    previousPresentation?.presentationId &&
    (!presentation?.presentationId || presentation.state === 'unassigned')
  ) {
    emitApiEvent(clientId, 'presentation_unloaded', {
      presentationId: previousPresentation.presentationId,
      revision: previousPresentation.revision,
    })
  } else if (presentation?.presentationId) {
    const payload = {
      presentationId: presentation.presentationId,
      revision: presentation.revision,
      sectionId: presentation.sectionId,
      slideId: presentation.slideId,
      state: presentation.state,
    }
    if (
      presentation.state !== 'loading' &&
      presentation.state !== 'error' &&
      (previousPresentation?.presentationId !== presentation.presentationId ||
        previousPresentation?.revision !== presentation.revision ||
        previousPresentation?.state === 'loading' ||
        previousPresentation?.state === 'error')
    ) {
      emitApiEvent(clientId, 'presentation_loaded', payload)
    }
    if (previousPresentation?.slideId !== presentation.slideId) {
      emitApiEvent(clientId, 'slide_changed', payload)
    }
    if (previousPresentation?.state !== presentation.state) {
      const eventByState: Partial<
        Record<PresentationActualState['state'], ApiEvent['type']>
      > = {
        playing: 'presentation_started',
        paused: 'presentation_paused',
        section_paused: 'section_paused',
        completed: 'presentation_completed',
        error: 'presentation_error',
      }
      const eventType = eventByState[presentation.state]
      if (eventType) emitApiEvent(clientId, eventType, payload)
    }
  }

  return nextStatus
}

export const getClientStatus = (clientId: string): ClientStatus | null =>
  getGatewayState().statusesPerClient[clientId] ?? null

export const getClientQueueSummary = (clientId: string) => {
  const queue = getQueueIfExists(clientId)

  return {
    messageCount: queue?.messages.length ?? 0,
    commandCount: queue?.commands.length ?? 0,
    lastAccessed: queue?.lastAccessed ?? null,
  }
}

export const __resetMessageGatewayForTests = () => {
  const state = getGatewayState()

  state.queuesPerClient = {}
  state.statusesPerClient = {}
  state.recentEvents = []
  state.eventListeners = []
}
