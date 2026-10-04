/**
 * @jest-environment jsdom
 */

jest.mock('@/features/vrmViewer/viewer', () => ({
  Viewer: jest.fn().mockImplementation(() => ({
    model: null,
  })),
}))
jest.mock('pixi-live2d-display-lipsyncpatch', () => ({}))
jest.mock('@/features/memory/memoryStoreSync', () => ({
  addEmbeddingsToMessages: jest.fn((msgs: unknown[]) => Promise.resolve(msgs)),
}))
jest.mock('@/features/messages/messageSelectors', () => ({
  messageSelectors: {
    cutImageMessage: (chatLog: unknown[]) => chatLog,
    sanitizeMessageForStorage: (msg: unknown) => msg,
  },
}))

describe('homeStore persistence debounce', () => {
  const storageKey = 'aitube-kit-home'

  beforeEach(() => {
    jest.resetModules()
    jest.useFakeTimers()
    localStorage.clear()
    ;(global as typeof globalThis & { fetch: jest.Mock }).fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
      })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
    localStorage.clear()
    delete (global as { fetch?: unknown }).fetch
  })

  it('debounces repeated chat log persistence during streaming updates', async () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
    const homeStore = require('@/features/stores/home').default

    homeStore.setState({ chatLog: [] })
    setItemSpy.mockClear()

    homeStore.getState().upsertMessage({
      id: 'assistant-stream',
      role: 'assistant',
      content: 'a',
    })
    homeStore.getState().upsertMessage({
      id: 'assistant-stream',
      content: 'ab',
    })
    homeStore.getState().upsertMessage({
      id: 'assistant-stream',
      content: 'abc',
    })

    await Promise.resolve()
    expect(setItemSpy).not.toHaveBeenCalledWith(storageKey, expect.any(String))

    jest.advanceTimersByTime(800)

    expect(setItemSpy).toHaveBeenCalledTimes(1)
    expect(setItemSpy).toHaveBeenLastCalledWith(
      storageKey,
      expect.stringContaining('"content":"abc"')
    )
  })
})
