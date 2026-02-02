/**
 * @jest-environment node
 */

const mockAddToast = jest.fn()
const mockRemoveToast = jest.fn()
jest.mock('@/features/stores/toast', () => ({
  getState: () => ({
    addToast: (...args: unknown[]) => mockAddToast(...args),
    removeToast: (...args: unknown[]) => mockRemoveToast(...args),
  }),
}))

jest.mock('@/features/stores/settings', () => ({
  getState: () => ({
    realtimeAPIMode: true,
    selectAIService: 'openai',
  }),
}))

import { WebSocketManager } from '@/utils/WebSocketManager'

// Mock WebSocket in Node environment
class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  readyState = MockWebSocket.OPEN
  listeners: Record<string, Function[]> = {}

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(fn)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
  }

  // Helper to trigger events in tests
  trigger(event: string, data?: unknown) {
    ;(this.listeners[event] || []).forEach((fn) => fn(data))
  }
}

// Assign to global for isConnected check
;(global as any).WebSocket = MockWebSocket

describe('WebSocketManager', () => {
  const mockT = jest.fn((key: string) => key)
  let mockWs: MockWebSocket
  let mockConnectWebsocket: jest.Mock
  let handlers: {
    onOpen: jest.Mock
    onMessage: jest.Mock
    onError: jest.Mock
    onClose: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockWs = new MockWebSocket()
    mockConnectWebsocket = jest.fn(() => mockWs as unknown as WebSocket)
    handlers = {
      onOpen: jest.fn(),
      onMessage: jest.fn().mockResolvedValue(undefined),
      onError: jest.fn(),
      onClose: jest.fn(),
    }
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('connect', () => {
    it('should call connectWebsocket and register event listeners', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      expect(mockConnectWebsocket).toHaveBeenCalledTimes(1)
      expect(mockWs.listeners['open']).toHaveLength(1)
      expect(mockWs.listeners['message']).toHaveLength(1)
      expect(mockWs.listeners['error']).toHaveLength(1)
      expect(mockWs.listeners['close']).toHaveLength(1)
    })

    it('should show connection attempt toast', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: 'websocket-connection-info',
          type: 'info',
        })
      )
    })

    it('should handle null websocket from connectWebsocket', () => {
      const nullConnect = jest.fn(() => null)
      const manager = new WebSocketManager(mockT, handlers, nullConnect as any)
      manager.connect()

      expect(nullConnect).toHaveBeenCalledTimes(1)
      expect(manager.websocket).toBeNull()
    })
  })

  describe('event handlers', () => {
    it('should show success toast on open and call handler', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      mockWs.trigger('open', new Event('open'))

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: 'websocket-connection-success',
          type: 'success',
        })
      )
      expect(handlers.onOpen).toHaveBeenCalled()
    })

    it('should call onMessage handler', async () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      const msgEvent = { data: 'test' }
      await mockWs.listeners['message'][0](msgEvent)

      expect(handlers.onMessage).toHaveBeenCalledWith(msgEvent)
    })

    it('should show error toast on error', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      mockWs.trigger('error', new Event('error'))

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: 'websocket-connection-error',
          type: 'error',
        })
      )
      expect(handlers.onError).toHaveBeenCalled()
    })

    it('should show close toast on close', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      mockWs.trigger('close', new Event('close'))

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          tag: 'websocket-connection-close',
          type: 'error',
        })
      )
      expect(handlers.onClose).toHaveBeenCalled()
    })
  })

  describe('disconnect', () => {
    it('should close the websocket', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      const closeSpy = jest.spyOn(mockWs, 'close')
      manager.disconnect()

      expect(closeSpy).toHaveBeenCalled()
    })
  })

  describe('reconnect', () => {
    it('should disconnect and reconnect', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      const result = manager.reconnect()

      expect(result).toBe(true)
      // connectWebsocket called twice: initial + reconnect
      expect(mockConnectWebsocket).toHaveBeenCalledTimes(2)
    })
  })

  describe('removeToast', () => {
    it('should remove all websocket-related toasts', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.removeToast()

      expect(mockRemoveToast).toHaveBeenCalledWith('websocket-connection-error')
      expect(mockRemoveToast).toHaveBeenCalledWith(
        'websocket-connection-success'
      )
      expect(mockRemoveToast).toHaveBeenCalledWith('websocket-connection-close')
      expect(mockRemoveToast).toHaveBeenCalledWith('websocket-connection-info')
    })
  })

  describe('isConnected', () => {
    it('should return true when ws is open', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.connect()

      expect(manager.isConnected()).toBe(true)
    })

    it('should return false when ws is null', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )

      expect(manager.isConnected()).toBe(false)
    })
  })

  describe('textBlockStarted', () => {
    it('should default to false', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      expect(manager.textBlockStarted).toBe(false)
    })

    it('should update via setTextBlockStarted', () => {
      const manager = new WebSocketManager(
        mockT,
        handlers,
        mockConnectWebsocket
      )
      manager.setTextBlockStarted(true)
      expect(manager.textBlockStarted).toBe(true)
    })
  })
})
