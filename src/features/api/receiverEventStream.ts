export type ReceiverWakeup = 'messages' | 'commands'

type ReceiverEventStreamOptions = {
  targetId: string
  headers: Record<string, string>
  signal: AbortSignal
  onWakeup: (wakeup: ReceiverWakeup) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: unknown) => void
}

/**
 * 実行中に重なった通知を捨てず、完了直後の1回へまとめる。
 */
export const createCoalescedRunner = (task: () => Promise<void>) => {
  let running: Promise<void> | null = null
  let queued = false

  return (): Promise<void> => {
    queued = true
    if (running) return running

    running = (async () => {
      try {
        while (queued) {
          queued = false
          await task()
        }
      } finally {
        running = null
      }
    })()
    return running
  }
}

export const createOrderedReceiverDrainRunner = ({
  fetchCommands,
  fetchMessages,
}: {
  fetchCommands: () => Promise<void>
  fetchMessages: () => Promise<void>
}) =>
  createCoalescedRunner(async () => {
    await fetchCommands()
    await fetchMessages()
  })

const INITIAL_RECONNECT_DELAY_MS = 250
const MAX_RECONNECT_DELAY_MS = 5_000
const RECONNECT_BACKOFF_RESET_AFTER_MS = 15_000

export const receiverWakeupForEvent = (
  eventType: string
): ReceiverWakeup | null => {
  if (eventType === 'message_queued') return 'messages'
  if (eventType === 'command_queued' || eventType === 'stop_requested') {
    return 'commands'
  }
  return null
}

const consumeSseBlock = (
  block: string,
  onWakeup: (wakeup: ReceiverWakeup) => void
) => {
  const eventLine = block
    .split(/\r?\n/)
    .find((line) => line.startsWith('event:'))
  if (!eventLine) return
  const wakeup = receiverWakeupForEvent(eventLine.slice('event:'.length).trim())
  if (wakeup) onWakeup(wakeup)
}

const waitForReconnect = (signal: AbortSignal, delayMs: number) =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const handleAbort = () => {
      clearTimeout(timeoutId)
      resolve()
    }
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve()
    }, delayMs)
    signal.addEventListener('abort', handleAbort, { once: true })
  })

/**
 * Receiver向けの認証付きSSE購読。
 * EventSourceはAuthorization headerを付けられないためfetch streamを使う。
 */
export const subscribeReceiverEventStream = async ({
  targetId,
  headers,
  signal,
  onWakeup,
  onConnectionChange,
  onError,
}: ReceiverEventStreamOptions): Promise<void> => {
  let reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS

  while (!signal.aborted) {
    let connected = false
    let connectedAt = 0
    try {
      const response = await fetch(
        `/api/v1/events/?receiverId=${encodeURIComponent(targetId)}`,
        {
          headers: { ...headers, Accept: 'text/event-stream' },
          signal,
        }
      )
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      if (!response.body) throw new Error('Event stream body is missing')

      connected = true
      connectedAt = Date.now()
      onConnectionChange?.(true)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (!signal.aborted) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let boundary = buffer.search(/\r?\n\r?\n/)
        while (boundary >= 0) {
          const block = buffer.slice(0, boundary)
          const delimiter = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0]
          buffer = buffer.slice(boundary + (delimiter?.length ?? 2))
          consumeSseBlock(block, onWakeup)
          boundary = buffer.search(/\r?\n\r?\n/)
        }
      }
      if (!signal.aborted) throw new Error('Event stream disconnected')
    } catch (error) {
      if (!signal.aborted) onError?.(error)
    } finally {
      if (
        connected &&
        Date.now() - connectedAt >= RECONNECT_BACKOFF_RESET_AFTER_MS
      ) {
        reconnectDelayMs = INITIAL_RECONNECT_DELAY_MS
      }
      if (connected) onConnectionChange?.(false)
    }

    if (signal.aborted) break
    await waitForReconnect(signal, reconnectDelayMs)
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS)
  }
}
