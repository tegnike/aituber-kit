export const RECEIVER_ID_PREFIX = 'aituber-receiver-'

export type ReceiverKind = 'browser' | 'obs' | 'legacy'

export type ReceiverCapability = 'chat' | 'presentation' | 'speech'

export interface ReceiverDescriptor {
  receiverId: string
  configuredClientId: string
  displayName: string
  kind: Exclude<ReceiverKind, 'legacy'>
  capabilities: ReceiverCapability[]
}

export const createReceiverId = (sessionId: string) =>
  `${RECEIVER_ID_PREFIX}${sessionId}`

export const getReceiverKind = (
  userAgent: string
): Exclude<ReceiverKind, 'legacy'> =>
  /OBS\//i.test(userAgent) ? 'obs' : 'browser'

export const getReceiverDisplayName = (
  userAgent: string,
  receiverId: string
) => {
  const suffix = receiverId.slice(-8)
  if (/OBS\//i.test(userAgent)) return `OBS ${suffix}`
  if (/Edg\//.test(userAgent)) return `Edge ${suffix}`
  if (/Chrome\//.test(userAgent)) return `Chrome ${suffix}`
  if (/Firefox\//.test(userAgent)) return `Firefox ${suffix}`
  if (/Safari\//.test(userAgent)) return `Safari ${suffix}`
  return `Browser ${suffix}`
}

export const getReceiverCapabilities = (
  messageReceiverEnabled: boolean
): ReceiverCapability[] => [
  'presentation',
  ...(messageReceiverEnabled ? (['chat', 'speech'] as const) : []),
]

export const createReceiverDescriptor = (
  configuredClientId: string,
  sessionId: string,
  userAgent: string,
  messageReceiverEnabled: boolean
): ReceiverDescriptor => {
  const receiverId = createReceiverId(sessionId)
  return {
    receiverId,
    configuredClientId,
    displayName: getReceiverDisplayName(userAgent, receiverId),
    kind: getReceiverKind(userAgent),
    capabilities: getReceiverCapabilities(messageReceiverEnabled),
  }
}
