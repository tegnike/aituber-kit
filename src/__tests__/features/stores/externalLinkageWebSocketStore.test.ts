/**
 * @jest-environment node
 */

const mockConnect = jest.fn()
const mockDisconnect = jest.fn()
const mockReconnect = jest.fn().mockReturnValue(true)
const mockSend = jest.fn().mockReturnValue(true)

jest.mock('@/utils/ExternalLinkageWebSocketManager', () => ({
  ExternalLinkageWebSocketManager: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    reconnect: mockReconnect,
    send: mockSend,
  })),
}))

import type { TFunction } from 'i18next'
import externalLinkageWebSocketStore from '@/features/stores/externalLinkageWebSocketStore'
import { ExternalLinkageWebSocketManager } from '@/utils/ExternalLinkageWebSocketManager'

describe('externalLinkageWebSocketStore', () => {
  const mockT = jest.fn((key: string) => key) as unknown as TFunction
  const mockHandlers = {
    onOpen: jest.fn(),
    onMessage: jest.fn(),
    onError: jest.fn(),
    onClose: jest.fn(),
  }
  const mockConnectWebsocket = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    externalLinkageWebSocketStore.setState({
      wsManager: null,
      status: 'idle',
      protocolVersion: 'legacy',
      capabilities: [],
      connectedAt: null,
      lastError: null,
      heartbeatStatus: 'idle',
      lastPongAt: null,
      lastAckAt: null,
      activeRequestId: null,
      lastRequestId: null,
      requestStatus: 'idle',
      requestError: null,
      reconnectCount: 0,
      reconnectDelayMs: 1000,
      nextReconnectAt: null,
    })
  })

  it('creates a dedicated external linkage WebSocket manager', () => {
    externalLinkageWebSocketStore
      .getState()
      .initializeWebSocket(mockT, mockHandlers, mockConnectWebsocket)

    expect(ExternalLinkageWebSocketManager).toHaveBeenCalledTimes(1)
    expect(mockConnect).toHaveBeenCalledTimes(1)
    expect(externalLinkageWebSocketStore.getState().wsManager).not.toBeNull()
  })

  it('disconnects and clears the manager', () => {
    externalLinkageWebSocketStore
      .getState()
      .initializeWebSocket(mockT, mockHandlers, mockConnectWebsocket)
    externalLinkageWebSocketStore.setState({
      lastError: 'old error',
      lastAckAt: '2026-01-01T00:00:00.000Z',
      lastRequestId: 'msg_old',
      requestError: 'request failed',
    })

    externalLinkageWebSocketStore.getState().disconnect()

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
    expect(externalLinkageWebSocketStore.getState().wsManager).toBeNull()
    expect(externalLinkageWebSocketStore.getState().status).toBe('idle')
    expect(externalLinkageWebSocketStore.getState().lastError).toBeNull()
    expect(externalLinkageWebSocketStore.getState().lastAckAt).toBeNull()
    expect(externalLinkageWebSocketStore.getState().lastRequestId).toBeNull()
    expect(externalLinkageWebSocketStore.getState().requestError).toBeNull()
  })

  it('reconnects through the manager without incrementing scheduled retry count', () => {
    externalLinkageWebSocketStore
      .getState()
      .initializeWebSocket(mockT, mockHandlers, mockConnectWebsocket)

    const result = externalLinkageWebSocketStore.getState().reconnect()

    expect(result).toBe(true)
    expect(mockReconnect).toHaveBeenCalledTimes(1)
    expect(externalLinkageWebSocketStore.getState().reconnectCount).toBe(0)
  })

  it('tracks v2 protocol capabilities', () => {
    externalLinkageWebSocketStore
      .getState()
      .setProtocolVersion('2', ['chat.message', 'pong'])

    expect(externalLinkageWebSocketStore.getState().protocolVersion).toBe('2')
    expect(externalLinkageWebSocketStore.getState().capabilities).toEqual([
      'chat.message',
      'pong',
    ])
  })

  it('tracks heartbeat pong state', () => {
    externalLinkageWebSocketStore.getState().markPong()

    expect(externalLinkageWebSocketStore.getState().heartbeatStatus).toBe(
      'healthy'
    )
    expect(externalLinkageWebSocketStore.getState().lastPongAt).not.toBeNull()
  })

  it('tracks request status from sent to acknowledged and completed', () => {
    externalLinkageWebSocketStore.getState().startRequest('msg_request')

    expect(externalLinkageWebSocketStore.getState().activeRequestId).toBe(
      'msg_request'
    )
    expect(externalLinkageWebSocketStore.getState().lastRequestId).toBe(
      'msg_request'
    )
    expect(externalLinkageWebSocketStore.getState().requestStatus).toBe('sent')

    externalLinkageWebSocketStore.getState().markAck('msg_request')

    expect(externalLinkageWebSocketStore.getState().requestStatus).toBe(
      'acknowledged'
    )
    expect(externalLinkageWebSocketStore.getState().lastAckAt).not.toBeNull()

    externalLinkageWebSocketStore.getState().completeRequest('msg_request')

    expect(externalLinkageWebSocketStore.getState().activeRequestId).toBeNull()
    expect(externalLinkageWebSocketStore.getState().requestStatus).toBe(
      'completed'
    )
  })

  it('tracks request errors without clearing unrelated active requests', () => {
    externalLinkageWebSocketStore.getState().startRequest('msg_active')

    externalLinkageWebSocketStore
      .getState()
      .failRequest('msg_other', 'server failed')

    expect(externalLinkageWebSocketStore.getState().activeRequestId).toBe(
      'msg_active'
    )
    expect(externalLinkageWebSocketStore.getState().requestStatus).toBe('sent')

    externalLinkageWebSocketStore
      .getState()
      .failRequest('msg_active', 'server failed')

    expect(externalLinkageWebSocketStore.getState().activeRequestId).toBeNull()
    expect(externalLinkageWebSocketStore.getState().requestStatus).toBe('error')
    expect(externalLinkageWebSocketStore.getState().requestError).toBe(
      'server failed'
    )
  })

  it('tracks reconnect backoff state', () => {
    externalLinkageWebSocketStore.getState().markReconnectScheduled(1000)

    expect(externalLinkageWebSocketStore.getState().reconnectCount).toBe(1)
    expect(externalLinkageWebSocketStore.getState().reconnectDelayMs).toBe(2000)
    expect(
      externalLinkageWebSocketStore.getState().nextReconnectAt
    ).not.toBeNull()
  })

  it('sends data through the dedicated manager', () => {
    externalLinkageWebSocketStore
      .getState()
      .initializeWebSocket(mockT, mockHandlers, mockConnectWebsocket)

    const result = externalLinkageWebSocketStore
      .getState()
      .send(JSON.stringify({ type: 'chat', content: 'hello' }))

    expect(result).toBe(true)
    expect(mockSend).toHaveBeenCalledWith(
      JSON.stringify({ type: 'chat', content: 'hello' })
    )
  })
})
