/**
 * @jest-environment node
 */

import type { NextApiRequest, NextApiResponse } from 'next'

function createMockReq(
  overrides: Partial<NextApiRequest> = {}
): NextApiRequest {
  return {
    method: 'POST',
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as NextApiRequest
}

function createMockRes(): NextApiResponse & {
  _status: number
  _json: unknown
  _headers: Record<string, string>
  _writes: string[]
} {
  const res = {
    _status: 200,
    _json: null as unknown,
    _headers: {} as Record<string, string>,
    _writes: [] as string[],
    status(code: number) {
      res._status = code
      return res
    },
    json(data: unknown) {
      res._json = data
      return res
    },
    writeHead(code: number, headers: Record<string, string>) {
      res._status = code
      res._headers = headers
      return res
    },
    write(chunk: string) {
      res._writes.push(chunk)
      return true
    },
  }
  return res as unknown as NextApiResponse & {
    _status: number
    _json: unknown
    _headers: Record<string, string>
    _writes: string[]
  }
}

describe('/api/v1 external API', () => {
  const originalApiKey = process.env.AITUBERKIT_API_KEY
  const originalPublicApiKey = process.env.NEXT_PUBLIC_AITUBERKIT_API_KEY

  beforeEach(() => {
    jest.resetModules()
    process.env.AITUBERKIT_API_KEY = 'test-api-key'
    delete process.env.NEXT_PUBLIC_AITUBERKIT_API_KEY
    require('@/features/api/messageGateway').__resetMessageGatewayForTests()
  })

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.AITUBERKIT_API_KEY
    } else {
      process.env.AITUBERKIT_API_KEY = originalApiKey
    }
    if (originalPublicApiKey === undefined) {
      delete process.env.NEXT_PUBLIC_AITUBERKIT_API_KEY
    } else {
      process.env.NEXT_PUBLIC_AITUBERKIT_API_KEY = originalPublicApiKey
    }
  })

  it('requires bearer authentication for v1 endpoints', () => {
    const speak = require('@/pages/api/v1/speak').default
    const res = createMockRes()

    speak(
      createMockReq({
        method: 'POST',
        query: { clientId: 'client1' },
        body: { text: 'hello' },
      }),
      res
    )

    expect(res._status).toBe(401)
    expect(res._json).toEqual({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY',
    })
  })

  it('lists active receiver instances without exposing legacy duplicates', () => {
    const { updateClientStatus } = require('@/features/api/messageGateway')
    const receivers = require('@/pages/api/v1/receivers').default
    const commonStatus = {
      connected: true,
      isSpeaking: false,
      chatProcessing: false,
      messageReceiverEnabled: true,
    }

    updateClientStatus('aituber-receiver-tab-1', {
      ...commonStatus,
      configuredClientId: 'stage',
      receiverDisplayName: 'Chrome tab-1',
      receiverKind: 'browser',
      receiverCapabilities: ['presentation', 'chat', 'speech'],
    })
    updateClientStatus('stage', {
      ...commonStatus,
      configuredClientId: 'stage',
      receiverDisplayName: 'AITuberKit legacy receiver',
      receiverKind: 'legacy',
    })

    const res = createMockRes()
    receivers(
      createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer test-api-key' },
      }),
      res
    )

    expect(res._status).toBe(200)
    expect(res._json).toEqual({
      ok: true,
      receivers: [
        expect.objectContaining({
          receiverId: 'aituber-receiver-tab-1',
          configuredClientId: 'stage',
          displayName: 'Chrome tab-1',
          kind: 'browser',
          capabilities: ['presentation', 'chat', 'speech'],
          connected: true,
          isSpeaking: false,
          lastSeenAt: expect.any(String),
        }),
      ],
    })
  })

  it('accepts receiverId as the preferred routing parameter', () => {
    const speak = require('@/pages/api/v1/speak').default
    const messages = require('@/pages/api/v1/client/messages').default
    const speakRes = createMockRes()

    speak(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { receiverId: 'aituber-receiver-tab-1' },
        body: { text: 'receiver routed message' },
      }),
      speakRes
    )

    const unauthenticatedRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { receiverId: 'aituber-receiver-tab-1' },
      }),
      unauthenticatedRes
    )
    expect(unauthenticatedRes._status).toBe(401)

    const messagesRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer test-api-key' },
        query: { receiverId: 'aituber-receiver-tab-1' },
      }),
      messagesRes
    )

    expect(speakRes._status).toBe(202)
    expect((messagesRes._json as { messages: unknown[] }).messages).toEqual([
      expect.objectContaining({ message: 'receiver routed message' }),
    ])
  })

  it('does not accept public env keys or query string API keys for v1 authentication', () => {
    delete process.env.AITUBERKIT_API_KEY
    process.env.NEXT_PUBLIC_AITUBERKIT_API_KEY = 'public-key'
    jest.resetModules()
    const speak = require('@/pages/api/v1/speak').default

    const publicEnvRes = createMockRes()
    speak(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer public-key' },
        query: { clientId: 'client1' },
        body: { text: 'hello' },
      }),
      publicEnvRes
    )

    expect(publicEnvRes._status).toBe(503)
    expect(publicEnvRes._json).toEqual({
      error: 'AITuberKit API key is not configured',
      code: 'API_KEY_NOT_CONFIGURED',
    })

    process.env.AITUBERKIT_API_KEY = 'test-api-key'
    jest.resetModules()
    const secureSpeak = require('@/pages/api/v1/speak').default
    const queryKeyRes = createMockRes()
    secureSpeak(
      createMockReq({
        method: 'POST',
        query: { clientId: 'client1', apiKey: 'test-api-key' },
        body: { text: 'hello' },
      }),
      queryKeyRes
    )

    expect(queryKeyRes._status).toBe(401)
  })

  it('queues speak requests as direct_send messages for the existing receiver', () => {
    const speak = require('@/pages/api/v1/speak').default
    const messages = require('@/pages/api/messages').default

    const speakRes = createMockRes()
    speak(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: {
          text: 'hello from v1',
          emotion: 'happy',
          priority: 'high',
          speechSessionId: 'answer-stream-1',
        },
      }),
      speakRes
    )

    expect(speakRes._status).toBe(202)
    expect(speakRes._json).toEqual(
      expect.objectContaining({
        ok: true,
        clientId: 'client1',
        count: 1,
      })
    )

    const getRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      }),
      getRes
    )

    expect(getRes._status).toBe(200)
    expect((getRes._json as { messages: unknown[] }).messages[0]).toEqual(
      expect.objectContaining({
        message: 'hello from v1',
        type: 'direct_send',
        emotion: 'happy',
        speechSessionId: 'answer-stream-1',
        priority: 'high',
        source: 'v1',
      })
    )
  })

  it('同一発話セッションの高優先度チャンクをFIFOで取得する', () => {
    const speak = require('@/pages/api/v1/speak').default
    const messages = require('@/pages/api/v1/client/messages').default
    const enqueue = (text: string, speechSessionId: string) =>
      speak(
        createMockReq({
          method: 'POST',
          headers: { authorization: 'Bearer test-api-key' },
          query: { clientId: 'client1' },
          body: { text, priority: 'high', speechSessionId },
        }),
        createMockRes()
      )

    enqueue('先に送ったチャンク', 'answer-stream-1')
    enqueue('別セッションの高優先度発話', 'answer-stream-2')
    enqueue('後に送ったチャンク', 'answer-stream-1')

    const res = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
      }),
      res
    )

    expect(
      (res._json as { messages: Array<{ message: string }> }).messages.map(
        (message) => message.message
      )
    ).toEqual([
      '別セッションの高優先度発話',
      '先に送ったチャンク',
      '後に送ったチャンク',
    ])
  })

  it('queues v1 messages requests with the legacy messages payload shape', () => {
    const v1Messages = require('@/pages/api/v1/messages').default
    const messages = require('@/pages/api/messages').default

    const res = createMockRes()
    v1Messages(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: {
          messages: ['hello from v1 messages'],
          type: 'direct_send',
          emotion: 'happy',
        },
      }),
      res
    )

    expect(res._status).toBe(202)
    expect(res._json).toEqual(
      expect.objectContaining({
        ok: true,
        clientId: 'client1',
        type: 'direct_send',
        count: 1,
      })
    )

    const getRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      }),
      getRes
    )

    expect((getRes._json as { messages: unknown[] }).messages[0]).toEqual(
      expect.objectContaining({
        message: 'hello from v1 messages',
        type: 'direct_send',
        emotion: 'happy',
        source: 'v1',
      })
    )
  })

  it('defaults v1 messages requests to direct_send when type is omitted', () => {
    const v1Messages = require('@/pages/api/v1/messages').default
    const messages = require('@/pages/api/messages').default

    const res = createMockRes()
    v1Messages(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: { messages: ['default direct send'] },
      }),
      res
    )

    expect(res._status).toBe(202)

    const getRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      }),
      getRes
    )

    expect((getRes._json as { messages: unknown[] }).messages[0]).toEqual(
      expect.objectContaining({
        message: 'default direct send',
        type: 'direct_send',
      })
    )
  })

  it('falls back to text when v1 messages contains an empty messages array', () => {
    const v1Messages = require('@/pages/api/v1/messages').default
    const messages = require('@/pages/api/messages').default

    const res = createMockRes()
    v1Messages(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: {
          messages: [],
          text: 'fallback text',
        },
      }),
      res
    )

    expect(res._status).toBe(202)

    const getRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      }),
      getRes
    )

    expect((getRes._json as { messages: unknown[] }).messages[0]).toEqual(
      expect.objectContaining({
        message: 'fallback text',
        type: 'direct_send',
      })
    )
  })

  it('supports ai_generate through v1 messages requests', () => {
    const v1Messages = require('@/pages/api/v1/messages').default
    const messages = require('@/pages/api/messages').default

    const res = createMockRes()
    v1Messages(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: {
          text: 'describe this',
          type: 'ai_generate',
          useCurrentSystemPrompt: false,
          systemPrompt: 'Be concise',
        },
      }),
      res
    )

    expect(res._status).toBe(202)
    expect(res._json).toEqual(
      expect.objectContaining({
        type: 'ai_generate',
      })
    )

    const getRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      }),
      getRes
    )

    expect((getRes._json as { messages: unknown[] }).messages[0]).toEqual(
      expect.objectContaining({
        message: 'describe this',
        type: 'ai_generate',
        systemPrompt: 'Be concise',
        useCurrentSystemPrompt: false,
      })
    )
  })

  it('queues chat requests as user_input by default', () => {
    const chat = require('@/pages/api/v1/chat').default
    const messages = require('@/pages/api/messages').default

    chat(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: { text: 'please respond' },
      }),
      createMockRes()
    )

    const getRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      }),
      getRes
    )

    expect((getRes._json as { messages: unknown[] }).messages[0]).toEqual(
      expect.objectContaining({
        message: 'please respond',
        type: 'user_input',
      })
    )
  })

  it('keeps ai_generate callback secrets on the server', async () => {
    const chat = require('@/pages/api/v1/chat').default
    const callbackRoute = require('@/pages/api/v1/chat/callback').default
    const messages = require('@/pages/api/messages').default

    const res = createMockRes()
    chat(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: {
          messages: ['describe this'],
          mode: 'ai_generate',
          useCurrentSystemPrompt: false,
          systemPrompt: 'Be concise',
          responseCallback: {
            url: 'http://127.0.0.1:9892/api/question-responses',
            interactionId: 'qa-question-1',
            token: 'callback-token',
          },
        },
      }),
      res
    )

    expect(res._status).toBe(202)

    const getRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      }),
      getRes
    )

    const queuedMessage = (getRes._json as { messages: any[] }).messages[0]
    expect(queuedMessage).toEqual(
      expect.objectContaining({
        type: 'ai_generate',
        systemPrompt: 'Be concise',
        useCurrentSystemPrompt: false,
        responseCallback: {
          handle: expect.stringMatching(/^callback_/),
        },
      })
    )
    expect(JSON.stringify(queuedMessage)).not.toContain('callback-token')
    expect(JSON.stringify(queuedMessage)).not.toContain('question-responses')

    const originalFetch = global.fetch
    const callbackFetch = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = callbackFetch as typeof fetch
    try {
      const callbackRes = createMockRes()
      await callbackRoute(
        createMockReq({
          method: 'POST',
          headers: { authorization: 'Bearer test-api-key' },
          body: {
            handle: queuedMessage.responseCallback.handle,
            status: 'completed',
            content: 'Generated answer',
          },
        }),
        callbackRes
      )

      expect(callbackRes._status).toBe(200)
      expect(callbackFetch).toHaveBeenCalledWith(
        new URL('http://127.0.0.1:9892/api/question-responses'),
        expect.objectContaining({
          method: 'POST',
          redirect: 'error',
          body: expect.stringContaining('callback-token'),
        })
      )
    } finally {
      global.fetch = originalFetch
    }
  })

  it('keeps response callbacks available beyond the client queue timeout', () => {
    const gateway = require('@/features/api/messageGateway')
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000)
    try {
      const [message] = gateway.enqueueMessages({
        clientId: 'client1',
        messages: ['long-running response'],
        type: 'ai_generate',
        responseCallback: {
          url: 'http://127.0.0.1:9892/api/question-responses',
          interactionId: 'long-running',
          token: 'callback-token',
        },
      })
      now.mockReturnValue(1_000 + 6 * 60 * 1_000)

      expect(
        gateway.claimResponseCallback(message.responseCallback.handle)
      ).toEqual(expect.objectContaining({ interactionId: 'long-running' }))
    } finally {
      now.mockRestore()
    }
  })

  it('queues stop commands for the client command poller', () => {
    const stop = require('@/pages/api/v1/stop').default
    const commands = require('@/pages/api/v1/client/commands').default

    const stopRes = createMockRes()
    stop(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: { mode: 'all', reason: 'test' },
      }),
      stopRes
    )

    expect(stopRes._status).toBe(202)

    const commandRes = createMockRes()
    commands(
      createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
      }),
      commandRes
    )

    expect(commandRes._status).toBe(200)
    expect((commandRes._json as { commands: unknown[] }).commands[0]).toEqual(
      expect.objectContaining({
        command: 'stop',
        mode: 'all',
        reason: 'test',
      })
    )
  })

  it('does not create queues for unknown clients during polling', () => {
    const messages = require('@/pages/api/messages').default
    const commands = require('@/pages/api/v1/client/commands').default
    const status = require('@/pages/api/v1/status').default

    const messagesRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'unknown-client' },
      }),
      messagesRes
    )
    expect(messagesRes._status).toBe(200)
    expect(messagesRes._json).toEqual({ messages: [] })

    const commandsRes = createMockRes()
    commands(
      createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'unknown-client' },
      }),
      commandsRes
    )
    expect(commandsRes._status).toBe(200)
    expect(commandsRes._json).toEqual({ commands: [] })

    const statusRes = createMockRes()
    status(
      createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'unknown-client' },
      }),
      statusRes
    )

    expect(statusRes._json).toEqual(
      expect.objectContaining({
        queue: {
          messageCount: 0,
          commandCount: 0,
          lastAccessed: null,
        },
      })
    )
  })

  it('requires authentication before updating client status', () => {
    const statusUpdate = require('@/pages/api/v1/client/status').default
    const unauthenticatedRes = createMockRes()

    statusUpdate(
      createMockReq({
        method: 'POST',
        query: { clientId: 'client1' },
        body: { connected: true },
      }),
      unauthenticatedRes
    )

    expect(unauthenticatedRes._status).toBe(401)
  })

  it('returns the latest client status and queue summary', () => {
    const statusUpdate = require('@/pages/api/v1/client/status').default
    const status = require('@/pages/api/v1/status').default
    const speak = require('@/pages/api/v1/speak').default

    const statusUpdateRes = createMockRes()
    statusUpdate(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: {
          connected: true,
          isSpeaking: true,
          chatProcessing: false,
          modelType: 'vrm',
          aiService: 'openai',
          voiceEngine: 'voicevox',
        },
      }),
      statusUpdateRes
    )

    expect(statusUpdateRes._status).toBe(200)

    speak(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: { text: 'queued' },
      }),
      createMockRes()
    )

    const statusRes = createMockRes()
    status(
      createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
      }),
      statusRes
    )

    expect(statusRes._status).toBe(200)
    expect(statusRes._json).toEqual(
      expect.objectContaining({
        ok: true,
        clientId: 'client1',
        status: expect.objectContaining({
          connected: true,
          isSpeaking: true,
          modelType: 'vrm',
        }),
        queue: expect.objectContaining({
          messageCount: 1,
          commandCount: 0,
        }),
      })
    )
  })

  it('emits events when speech starts and ends', () => {
    const {
      getRecentApiEvents,
      updateClientStatus,
    } = require('@/features/api/messageGateway')
    const baseStatus = {
      connected: true,
      chatProcessing: false,
    }

    updateClientStatus('client1', { ...baseStatus, isSpeaking: false })
    updateClientStatus('client1', { ...baseStatus, isSpeaking: true })
    updateClientStatus('client1', { ...baseStatus, isSpeaking: false })

    const speechEvents = getRecentApiEvents('client1').filter(
      (event: { type: string }) => event.type.startsWith('speech_')
    )
    expect(speechEvents).toEqual([
      expect.objectContaining({
        type: 'speech_started',
        payload: expect.objectContaining({ isSpeaking: true }),
      }),
      expect.objectContaining({
        type: 'speech_ended',
        payload: expect.objectContaining({ isSpeaking: false }),
      }),
    ])
  })

  it('emits speech_started when the first client status is already speaking', () => {
    const {
      getRecentApiEvents,
      updateClientStatus,
    } = require('@/features/api/messageGateway')

    updateClientStatus('client1', {
      connected: true,
      chatProcessing: true,
      isSpeaking: true,
    })

    expect(
      getRecentApiEvents('client1').filter(
        (event: { type: string }) => event.type === 'speech_started'
      )
    ).toHaveLength(1)
  })

  it('emits the exact text when each synthesized speech chunk starts', () => {
    const {
      getRecentApiEvents,
      updateClientStatus,
    } = require('@/features/api/messageGateway')
    const baseStatus = {
      connected: true,
      chatProcessing: false,
      isSpeaking: true,
    }

    updateClientStatus('client1', { ...baseStatus, activeSpeech: null })
    updateClientStatus('client1', {
      ...baseStatus,
      activeSpeech: { id: 'speech-1', text: '最初の音声チャンクです。' },
    })
    updateClientStatus('client1', {
      ...baseStatus,
      activeSpeech: { id: 'speech-2', text: '次の音声チャンクです。' },
    })
    updateClientStatus('client1', { ...baseStatus, activeSpeech: null })

    const chunkEvents = getRecentApiEvents('client1').filter(
      (event: { type: string }) => event.type.startsWith('speech_chunk_')
    )
    expect(chunkEvents).toEqual([
      expect.objectContaining({
        type: 'speech_chunk_started',
        payload: expect.objectContaining({
          speechChunkId: 'speech-1',
          text: '最初の音声チャンクです。',
        }),
      }),
      expect.objectContaining({
        type: 'speech_chunk_ended',
        payload: { speechChunkId: 'speech-1' },
      }),
      expect.objectContaining({
        type: 'speech_chunk_started',
        payload: expect.objectContaining({
          speechChunkId: 'speech-2',
          text: '次の音声チャンクです。',
        }),
      }),
      expect.objectContaining({
        type: 'speech_chunk_ended',
        payload: { speechChunkId: 'speech-2' },
      }),
    ])
  })

  it('emits slide_changed only after a presentation finishes loading', () => {
    const {
      getRecentApiEvents,
      updateClientStatus,
    } = require('@/features/api/messageGateway')
    const baseStatus = {
      connected: true,
      chatProcessing: false,
      isSpeaking: false,
    }
    const presentation = {
      presentationId: 'new-presentation',
      revision: 1,
      sectionId: 'section-1',
      slideIndex: 0,
      isSpeaking: false,
      lastError: null,
      updatedAt: '2026-08-03T00:00:00.000Z',
    }

    updateClientStatus('client1', {
      ...baseStatus,
      presentation: {
        ...presentation,
        presentationId: 'old-presentation',
        state: 'ready',
        slideId: 'old-slide',
      },
    })
    const eventCount = getRecentApiEvents('client1').length
    updateClientStatus('client1', {
      ...baseStatus,
      presentation: { ...presentation, state: 'loading', slideId: null },
    })
    expect(
      getRecentApiEvents('client1')
        .slice(eventCount)
        .map((event: { type: string }) => event.type)
    ).not.toContain('slide_changed')

    updateClientStatus('client1', {
      ...baseStatus,
      presentation: { ...presentation, state: 'ready', slideId: 'new-slide' },
    })
    expect(
      getRecentApiEvents('client1')
        .slice(eventCount)
        .map((event: { type: string }) => event.type)
    ).toEqual(expect.arrayContaining(['presentation_loaded', 'slide_changed']))
  })

  it('falls back from an empty receiverId when filtering event snapshots', () => {
    const speak = require('@/pages/api/v1/speak').default
    const events = require('@/pages/api/v1/events').default

    speak(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { receiverId: 'aituber-receiver-client1' },
        body: { text: 'event source' },
      }),
      createMockRes()
    )

    const eventsRes = createMockRes()
    events(
      createMockReq({
        method: 'GET',
        headers: { authorization: 'Bearer test-api-key' },
        query: {
          receiverId: '   ',
          clientId: '  aituber-receiver-client1  ',
          snapshot: 'true',
        },
      }),
      eventsRes
    )

    expect(eventsRes._status).toBe(200)
    expect(
      (eventsRes._json as { events: Array<{ type: string }> }).events
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'message_queued' }),
      ])
    )
  })

  it('falls back to text when speak messages is an empty array', () => {
    const speak = require('@/pages/api/v1/speak').default
    const messages = require('@/pages/api/messages').default

    const speakRes = createMockRes()
    speak(
      createMockReq({
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        query: { clientId: 'client1' },
        body: { messages: [], text: 'fallback text' },
      }),
      speakRes
    )

    expect(speakRes._status).toBe(202)

    const getRes = createMockRes()
    messages(
      createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      }),
      getRes
    )

    expect((getRes._json as { messages: unknown[] }).messages[0]).toEqual(
      expect.objectContaining({ message: 'fallback text' })
    )
  })
})
