import {
  createCoalescedRunner,
  receiverWakeupForEvent,
  subscribeReceiverEventStream,
  type ReceiverWakeup,
} from '@/features/api/receiverEventStream'

describe('receiverEventStream', () => {
  const originalFetch = global.fetch

  const createSseResponse = (chunks: string[]) => {
    let index = 0

    return {
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: jest.fn(async () => {
            if (index >= chunks.length) {
              return { done: true, value: undefined }
            }

            const value = new Uint8Array(Buffer.from(chunks[index]))
            index += 1
            return { done: false, value }
          }),
        }),
      },
    } as unknown as Response
  }

  afterEach(() => {
    jest.restoreAllMocks()
    if (originalFetch) {
      global.fetch = originalFetch
    } else {
      delete (global as typeof globalThis & { fetch?: typeof fetch }).fetch
    }
  })

  it('発話とコマンドのキューイベントだけを即時取得トリガーへ変換する', () => {
    expect(receiverWakeupForEvent('message_queued')).toBe('messages')
    expect(receiverWakeupForEvent('command_queued')).toBe('commands')
    expect(receiverWakeupForEvent('stop_requested')).toBe('commands')
    expect(receiverWakeupForEvent('status_updated')).toBeNull()
  })

  it('処理中に重なった通知を捨てず、1回の再実行へまとめる', async () => {
    let releaseFirstRun: (() => void) | undefined
    const firstRunGate = new Promise<void>((resolve) => {
      releaseFirstRun = resolve
    })
    const task = jest
      .fn<Promise<void>, []>()
      .mockImplementationOnce(() => firstRunGate)
      .mockResolvedValue(undefined)
    const run = createCoalescedRunner(task)

    const first = run()
    const second = run()
    const third = run()

    expect(second).toBe(first)
    expect(third).toBe(first)
    expect(task).toHaveBeenCalledTimes(1)

    releaseFirstRun?.()
    await first

    expect(task).toHaveBeenCalledTimes(2)
  })

  it('認証付きSSEの分割chunkを読み、Receiverの取得処理を起こす', async () => {
    const controller = new AbortController()
    const wakeups: ReceiverWakeup[] = []
    const connectionChanges: boolean[] = []
    const fetchMock = jest
      .fn()
      .mockResolvedValue(
        createSseResponse([
          ': connected\n\nevent: message_',
          'queued\ndata: {"type":"message_queued"}\n\n' +
            'event: status_updated\ndata: {}\n\n' +
            'event: command_queued\ndata: {"type":"command_queued"}\n\n',
        ])
      )
    global.fetch = fetchMock as unknown as typeof fetch

    await subscribeReceiverEventStream({
      targetId: 'receiver-1',
      headers: { Authorization: 'Bearer test-key' },
      signal: controller.signal,
      onWakeup: (wakeup) => {
        wakeups.push(wakeup)
        if (wakeups.length === 2) controller.abort()
      },
      onConnectionChange: (connected) => connectionChanges.push(connected),
    })

    expect(wakeups).toEqual(['messages', 'commands'])
    expect(connectionChanges).toEqual([true, false])
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/events/?receiverId=receiver-1',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-key',
          Accept: 'text/event-stream',
        },
        signal: controller.signal,
      })
    )
  })

  it('切断後に再接続し、フォールバック可能な接続状態を通知する', async () => {
    const controller = new AbortController()
    const errors: unknown[] = []
    const connectionChanges: boolean[] = []
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary disconnect'))
      .mockResolvedValueOnce(
        createSseResponse(['event: message_queued\ndata: {}\n\n'])
      )
    global.fetch = fetchMock as unknown as typeof fetch

    await subscribeReceiverEventStream({
      targetId: 'receiver-2',
      headers: { Authorization: 'Bearer test-key' },
      signal: controller.signal,
      onWakeup: () => controller.abort(),
      onConnectionChange: (connected) => connectionChanges.push(connected),
      onError: (error) => errors.push(error),
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(errors).toHaveLength(1)
    expect(connectionChanges).toEqual([true, false])
  })
})
