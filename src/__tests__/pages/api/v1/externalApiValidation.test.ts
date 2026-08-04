/**
 * @jest-environment node
 *
 * v1/* 外部制御APIのバリデーション・制限モード・SSE分岐のテスト。
 * ハッピーパスとキュー連携は externalApi.test.ts がカバーしている。
 */

import {
  createMockReq,
  createMockRes,
} from '../../../helpers/apiRouteTestUtils'

const originalEnv = { ...process.env }

const AUTH_HEADERS = { authorization: 'Bearer test-api-key' }

describe('/api/v1 validation and mode branches', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    process.env.AITUBERKIT_API_KEY = 'test-api-key'
    delete process.env.NEXT_PUBLIC_RESTRICTED_MODE
    require('@/features/api/messageGateway').__resetMessageGatewayForTests()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('restricted mode', () => {
    it.each([
      ['chat', '@/pages/api/v1/chat', 'POST'],
      ['speak', '@/pages/api/v1/speak', 'POST'],
      ['messages', '@/pages/api/v1/messages', 'POST'],
      ['stop', '@/pages/api/v1/stop', 'POST'],
      ['events', '@/pages/api/v1/events', 'GET'],
      ['status', '@/pages/api/v1/status', 'GET'],
    ])(
      'rejects v1/%s with 403 in restricted mode',
      (_name, modulePath, method) => {
        process.env.NEXT_PUBLIC_RESTRICTED_MODE = 'true'
        const handler = require(modulePath as string).default
        const res = createMockRes()

        handler(
          createMockReq({
            method: method as string,
            headers: AUTH_HEADERS,
            query: { clientId: 'client1' },
            body: { text: 'hello' },
          }),
          res
        )

        expect(res._status).toBe(403)
        expect(res._json).toEqual(
          expect.objectContaining({
            error: 'feature_disabled_in_restricted_mode',
          })
        )
      }
    )
  })

  describe('method validation', () => {
    it.each([
      ['chat', '@/pages/api/v1/chat', 'GET'],
      ['speak', '@/pages/api/v1/speak', 'GET'],
      ['messages', '@/pages/api/v1/messages', 'GET'],
      ['stop', '@/pages/api/v1/stop', 'GET'],
      ['events', '@/pages/api/v1/events', 'POST'],
      ['status', '@/pages/api/v1/status', 'POST'],
    ])(
      'rejects v1/%s with 405 for wrong method',
      (_name, modulePath, method) => {
        const handler = require(modulePath as string).default
        const res = createMockRes()

        handler(
          createMockReq({
            method: method as string,
            headers: AUTH_HEADERS,
            query: { clientId: 'client1' },
            body: { text: 'hello' },
          }),
          res
        )

        expect(res._status).toBe(405)
        expect(res._json).toEqual({ error: 'Method not allowed' })
      }
    )
  })

  describe('request validation', () => {
    it.each([
      ['chat', '@/pages/api/v1/chat'],
      ['speak', '@/pages/api/v1/speak'],
      ['messages', '@/pages/api/v1/messages'],
      ['stop', '@/pages/api/v1/stop'],
    ])(
      'rejects v1/%s with 400 when clientId is missing',
      (_name, modulePath) => {
        const handler = require(modulePath as string).default
        const res = createMockRes()

        handler(
          createMockReq({
            method: 'POST',
            headers: AUTH_HEADERS,
            body: { text: 'hello' },
          }),
          res
        )

        expect(res._status).toBe(400)
        expect(res._json).toEqual({ error: 'Client ID is required' })
      }
    )

    it.each([
      ['chat', '@/pages/api/v1/chat'],
      ['speak', '@/pages/api/v1/speak'],
      ['messages', '@/pages/api/v1/messages'],
    ])(
      'rejects v1/%s with 400 when text and messages are missing',
      (_name, modulePath) => {
        const handler = require(modulePath as string).default
        const res = createMockRes()

        handler(
          createMockReq({
            method: 'POST',
            headers: AUTH_HEADERS,
            query: { clientId: 'client1' },
            body: {},
          }),
          res
        )

        expect(res._status).toBe(400)
      }
    )

    it('rejects a non-string image on v1/chat with 400', () => {
      const handler = require('@/pages/api/v1/chat').default
      const res = createMockRes()

      handler(
        createMockReq({
          method: 'POST',
          headers: AUTH_HEADERS,
          query: { clientId: 'client1' },
          body: { text: 'hello', image: 123 },
        }),
        res
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'Image is not a string' })
    })

    it('rejects a non-string systemPrompt on v1/chat with 400', () => {
      const handler = require('@/pages/api/v1/chat').default
      const res = createMockRes()

      handler(
        createMockReq({
          method: 'POST',
          headers: AUTH_HEADERS,
          query: { clientId: 'client1' },
          body: { text: 'hello', systemPrompt: 42 },
        }),
        res
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'System prompt is not a string' })
    })

    it.each([123, '', 'x'.repeat(201)])(
      'rejects invalid speechSessionId on v1/speak: %p',
      (speechSessionId) => {
        const handler = require('@/pages/api/v1/speak').default
        const res = createMockRes()

        handler(
          createMockReq({
            method: 'POST',
            headers: AUTH_HEADERS,
            query: { clientId: 'client1' },
            body: { text: 'hello', speechSessionId },
          }),
          res
        )

        expect(res._status).toBe(400)
        expect(res._json).toEqual({ error: 'Invalid speech session ID' })
      }
    )

    it('rejects a non-loopback response callback on v1/chat with 400', () => {
      const handler = require('@/pages/api/v1/chat').default
      const res = createMockRes()

      handler(
        createMockReq({
          method: 'POST',
          headers: AUTH_HEADERS,
          query: { clientId: 'client1' },
          body: {
            text: 'hello',
            responseCallback: {
              url: 'https://example.com/callback',
              interactionId: 'qa-question-1',
              token: 'callback-token',
            },
          },
        }),
        res
      )

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'Invalid response callback' })
    })
  })

  describe('authentication alternatives', () => {
    it('accepts the x-aituberkit-api-key header on v1/chat', () => {
      const handler = require('@/pages/api/v1/chat').default
      const res = createMockRes()

      handler(
        createMockReq({
          method: 'POST',
          headers: { 'x-aituberkit-api-key': 'test-api-key' },
          query: { clientId: 'client1' },
          body: { text: 'hello' },
        }),
        res
      )

      expect(res._status).toBe(202)
    })
  })

  describe('chat interrupt', () => {
    it('queues a stop command before the chat message when interrupt is true', () => {
      const chat = require('@/pages/api/v1/chat').default
      const commands = require('@/pages/api/v1/client/commands').default

      const chatRes = createMockRes()
      chat(
        createMockReq({
          method: 'POST',
          headers: AUTH_HEADERS,
          query: { clientId: 'client1' },
          body: { text: 'urgent', interrupt: true },
        }),
        chatRes
      )
      expect(chatRes._status).toBe(202)

      const commandRes = createMockRes()
      commands(
        createMockReq({
          method: 'GET',
          headers: AUTH_HEADERS,
          query: { clientId: 'client1' },
        }),
        commandRes
      )

      expect((commandRes._json as { commands: unknown[] }).commands[0]).toEqual(
        expect.objectContaining({
          command: 'stop',
          reason: 'interrupt_before_chat',
        })
      )
    })
  })

  describe('events SSE stream', () => {
    it('streams recent events with SSE headers when snapshot is not requested', () => {
      const speak = require('@/pages/api/v1/speak').default
      const stop = require('@/pages/api/v1/stop').default
      const events = require('@/pages/api/v1/events').default
      const {
        enqueuePresentationControlCommand,
      } = require('@/features/api/messageGateway')

      speak(
        createMockReq({
          method: 'POST',
          headers: AUTH_HEADERS,
          query: { clientId: 'client1' },
          body: { text: 'event source' },
        }),
        createMockRes()
      )
      stop(
        createMockReq({
          method: 'POST',
          headers: AUTH_HEADERS,
          query: { clientId: 'client1' },
          body: { mode: 'queue' },
        }),
        createMockRes()
      )
      enqueuePresentationControlCommand('client1', 'next_slide')

      const res = createMockRes()
      events(
        createMockReq({
          method: 'GET',
          headers: AUTH_HEADERS,
          query: { clientId: 'client1' },
        }),
        res
      )

      expect(res._status).toBe(200)
      expect(res._headers['Content-Type']).toBe('text/event-stream')
      expect(res._writes[0]).toBe(': connected\n\n')
      expect(res._writes.join('')).toContain('event: message_queued')
      expect(res._writes.join('')).toContain('event: stop_requested')
      expect(res._writes.join('')).toContain('event: command_queued')
      res._emit('close')
    })
  })
})
