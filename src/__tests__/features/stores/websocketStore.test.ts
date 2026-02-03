/**
 * @jest-environment node
 */

const mockConnect = jest.fn()
const mockDisconnect = jest.fn()
const mockReconnect = jest.fn().mockReturnValue(true)

jest.mock('@/utils/WebSocketManager', () => ({
  WebSocketManager: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    reconnect: mockReconnect,
  })),
}))

import webSocketStore from '@/features/stores/websocketStore'
import { WebSocketManager } from '@/utils/WebSocketManager'

describe('webSocketStore', () => {
  const mockT = jest.fn((key: string) => key)
  const mockHandlers = {
    onOpen: jest.fn(),
    onMessage: jest.fn(),
    onError: jest.fn(),
    onClose: jest.fn(),
  }
  const mockConnectWebsocket = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    webSocketStore.setState({ wsManager: null })
  })

  describe('initializeWebSocket', () => {
    it('should create WebSocketManager and connect', () => {
      webSocketStore
        .getState()
        .initializeWebSocket(mockT, mockHandlers, mockConnectWebsocket)

      expect(WebSocketManager).toHaveBeenCalledTimes(1)
      expect(mockConnect).toHaveBeenCalledTimes(1)
      expect(webSocketStore.getState().wsManager).not.toBeNull()
    })

    it('should merge provided handlers with defaults', () => {
      const partialHandlers = { onOpen: jest.fn() }

      webSocketStore
        .getState()
        .initializeWebSocket(mockT, partialHandlers, mockConnectWebsocket)

      const constructorCall = (WebSocketManager as jest.Mock).mock.calls[0]
      const passedHandlers = constructorCall[1]

      expect(passedHandlers.onOpen).toBe(partialHandlers.onOpen)
      expect(typeof passedHandlers.onMessage).toBe('function')
      expect(typeof passedHandlers.onError).toBe('function')
      expect(typeof passedHandlers.onClose).toBe('function')
    })
  })

  describe('disconnect', () => {
    it('should call disconnect on manager and set to null', () => {
      webSocketStore
        .getState()
        .initializeWebSocket(mockT, mockHandlers, mockConnectWebsocket)

      webSocketStore.getState().disconnect()

      expect(mockDisconnect).toHaveBeenCalledTimes(1)
      expect(webSocketStore.getState().wsManager).toBeNull()
    })

    it('should be safe to call when no manager exists', () => {
      expect(() => webSocketStore.getState().disconnect()).not.toThrow()
    })
  })

  describe('reconnect', () => {
    it('should delegate to manager reconnect', () => {
      webSocketStore
        .getState()
        .initializeWebSocket(mockT, mockHandlers, mockConnectWebsocket)

      const result = webSocketStore.getState().reconnect()

      expect(mockReconnect).toHaveBeenCalledTimes(1)
      expect(result).toBe(true)
    })

    it('should return false when no manager exists', () => {
      const result = webSocketStore.getState().reconnect()
      expect(result).toBe(false)
    })
  })
})
