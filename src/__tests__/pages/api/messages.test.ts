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
    ...overrides,
  } as NextApiRequest
}

function createMockRes(): NextApiResponse & {
  _status: number
  _json: unknown
} {
  const res = {
    _status: 200,
    _json: null as unknown,
    status(code: number) {
      res._status = code
      return res
    },
    json(data: unknown) {
      res._json = data
      return res
    },
  }
  return res as unknown as NextApiResponse & {
    _status: number
    _json: unknown
  }
}

describe('/api/messages', () => {
  let handler: (req: NextApiRequest, res: NextApiResponse) => void

  beforeEach(() => {
    jest.resetModules()

    handler = require('@/pages/api/messages').default
  })

  describe('POST', () => {
    it('should return 400 when clientId is missing', () => {
      const req = createMockReq({
        method: 'POST',
        query: {},
        body: { messages: ['hello'] },
      })
      const res = createMockRes()

      handler(req, res)

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'Client ID is required' })
    })

    it('should return 400 when messages is not an array', () => {
      const req = createMockReq({
        method: 'POST',
        query: { clientId: 'client1' },
        body: { messages: 'not-array' },
      })
      const res = createMockRes()

      handler(req, res)

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'Messages array is required' })
    })

    it('should return 400 when messages is empty array', () => {
      const req = createMockReq({
        method: 'POST',
        query: { clientId: 'client1' },
        body: { messages: [] },
      })
      const res = createMockRes()

      handler(req, res)

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'Messages array is required' })
    })

    it('should return 400 when systemPrompt is not a string', () => {
      const req = createMockReq({
        method: 'POST',
        query: { clientId: 'client1' },
        body: { messages: ['hello'], systemPrompt: 123 },
      })
      const res = createMockRes()

      handler(req, res)

      expect(res._status).toBe(400)
      expect(res._json).toEqual({ error: 'System prompt is not a string' })
    })

    it('should return 400 when useCurrentSystemPrompt is not a boolean', () => {
      const req = createMockReq({
        method: 'POST',
        query: { clientId: 'client1' },
        body: { messages: ['hello'], useCurrentSystemPrompt: 'yes' },
      })
      const res = createMockRes()

      handler(req, res)

      expect(res._status).toBe(400)
      expect(res._json).toEqual({
        error: 'useCurrentSystemPrompt is not a boolean',
      })
    })

    it('should return 201 on successful POST', () => {
      const req = createMockReq({
        method: 'POST',
        query: { clientId: 'client1' },
        body: { messages: ['hello'] },
      })
      const res = createMockRes()

      handler(req, res)

      expect(res._status).toBe(201)
      expect(res._json).toEqual({ message: 'Successfully sent' })
    })

    it('should use default type direct_send when no type query', () => {
      const req = createMockReq({
        method: 'POST',
        query: { clientId: 'client1' },
        body: { messages: ['hello'] },
      })
      const res = createMockRes()

      handler(req, res)

      // Verify by GET
      const getReq = createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      })
      const getRes = createMockRes()

      handler(getReq, getRes)

      const messages = (getRes._json as { messages: unknown[] }).messages
      expect(messages).toHaveLength(1)
      expect(messages[0]).toEqual(
        expect.objectContaining({
          message: 'hello',
          type: 'direct_send',
        })
      )
    })

    it('should respect type query parameter', () => {
      const req = createMockReq({
        method: 'POST',
        query: { clientId: 'client1', type: 'ai_generate' },
        body: { messages: ['hello'] },
      })
      const res = createMockRes()

      handler(req, res)

      const getReq = createMockReq({
        method: 'GET',
        query: { clientId: 'client1' },
      })
      const getRes = createMockRes()

      handler(getReq, getRes)

      const messages = (getRes._json as { messages: unknown[] }).messages
      expect(messages[0]).toEqual(
        expect.objectContaining({ type: 'ai_generate' })
      )
    })

    it('should accumulate messages for the same client', () => {
      // First POST
      handler(
        createMockReq({
          method: 'POST',
          query: { clientId: 'client1' },
          body: { messages: ['first'] },
        }),
        createMockRes()
      )

      // Second POST
      handler(
        createMockReq({
          method: 'POST',
          query: { clientId: 'client1' },
          body: { messages: ['second'] },
        }),
        createMockRes()
      )

      const getRes = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: { clientId: 'client1' },
        }),
        getRes
      )

      const messages = (getRes._json as { messages: unknown[] }).messages
      expect(messages).toHaveLength(2)
      expect(messages[0]).toEqual(expect.objectContaining({ message: 'first' }))
      expect(messages[1]).toEqual(
        expect.objectContaining({ message: 'second' })
      )
    })

    it('should add multiple messages in a single POST', () => {
      handler(
        createMockReq({
          method: 'POST',
          query: { clientId: 'client1' },
          body: { messages: ['msg1', 'msg2', 'msg3'] },
        }),
        createMockRes()
      )

      const getRes = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: { clientId: 'client1' },
        }),
        getRes
      )

      const messages = (getRes._json as { messages: unknown[] }).messages
      expect(messages).toHaveLength(3)
    })

    it('should include systemPrompt and useCurrentSystemPrompt in messages', () => {
      handler(
        createMockReq({
          method: 'POST',
          query: { clientId: 'client1' },
          body: {
            messages: ['hello'],
            systemPrompt: 'Be helpful',
            useCurrentSystemPrompt: true,
          },
        }),
        createMockRes()
      )

      const getRes = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: { clientId: 'client1' },
        }),
        getRes
      )

      const messages = (getRes._json as { messages: unknown[] }).messages
      expect(messages[0]).toEqual(
        expect.objectContaining({
          systemPrompt: 'Be helpful',
          useCurrentSystemPrompt: true,
        })
      )
    })
  })

  describe('GET', () => {
    it('should return empty messages for new client', () => {
      const res = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: { clientId: 'new-client' },
        }),
        res
      )

      expect(res._status).toBe(200)
      expect(res._json).toEqual({ messages: [] })
    })

    it('should clear queue after GET', () => {
      // POST a message
      handler(
        createMockReq({
          method: 'POST',
          query: { clientId: 'client1' },
          body: { messages: ['hello'] },
        }),
        createMockRes()
      )

      // First GET
      const getRes1 = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: { clientId: 'client1' },
        }),
        getRes1
      )
      expect((getRes1._json as { messages: unknown[] }).messages).toHaveLength(
        1
      )

      // Second GET should be empty
      const getRes2 = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: { clientId: 'client1' },
        }),
        getRes2
      )
      expect((getRes2._json as { messages: unknown[] }).messages).toHaveLength(
        0
      )
    })

    it('should return 400 when clientId is missing', () => {
      const res = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: {},
        }),
        res
      )

      expect(res._status).toBe(400)
    })
  })

  describe('cleanup', () => {
    it('should clean up inactive clients on POST', () => {
      const realDateNow = Date.now

      try {
        // Create a client at time T
        let currentTime = 1000000
        Date.now = () => currentTime

        handler(
          createMockReq({
            method: 'POST',
            query: { clientId: 'old-client' },
            body: { messages: ['hello'] },
          }),
          createMockRes()
        )

        // Advance time by 6 minutes (past 5 minute timeout)
        currentTime += 1000 * 60 * 6

        // POST from a different client triggers cleanup
        handler(
          createMockReq({
            method: 'POST',
            query: { clientId: 'new-client' },
            body: { messages: ['world'] },
          }),
          createMockRes()
        )

        // Old client's queue should be cleaned up
        const getRes = createMockRes()
        handler(
          createMockReq({
            method: 'GET',
            query: { clientId: 'old-client' },
          }),
          getRes
        )
        expect((getRes._json as { messages: unknown[] }).messages).toHaveLength(
          0
        )
      } finally {
        Date.now = realDateNow
      }
    })

    it('should NOT clean up active clients', () => {
      const realDateNow = Date.now

      try {
        let currentTime = 1000000
        Date.now = () => currentTime

        handler(
          createMockReq({
            method: 'POST',
            query: { clientId: 'active-client' },
            body: { messages: ['hello'] },
          }),
          createMockRes()
        )

        // Advance time by only 2 minutes (within 5 minute timeout)
        currentTime += 1000 * 60 * 2

        // POST from a different client triggers cleanup
        handler(
          createMockReq({
            method: 'POST',
            query: { clientId: 'other-client' },
            body: { messages: ['world'] },
          }),
          createMockRes()
        )

        // Active client's queue should still exist
        const getRes = createMockRes()
        handler(
          createMockReq({
            method: 'GET',
            query: { clientId: 'active-client' },
          }),
          getRes
        )
        expect((getRes._json as { messages: unknown[] }).messages).toHaveLength(
          1
        )
      } finally {
        Date.now = realDateNow
      }
    })
  })

  describe('method validation', () => {
    it('should return 405 for PUT', () => {
      const res = createMockRes()
      handler(
        createMockReq({
          method: 'PUT',
          query: { clientId: 'client1' },
        }),
        res
      )

      expect(res._status).toBe(405)
      expect(res._json).toEqual({ error: 'Method not allowed' })
    })

    it('should return 405 for DELETE', () => {
      const res = createMockRes()
      handler(
        createMockReq({
          method: 'DELETE',
          query: { clientId: 'client1' },
        }),
        res
      )

      expect(res._status).toBe(405)
    })
  })

  describe('client isolation', () => {
    it('should isolate messages between different clients', () => {
      handler(
        createMockReq({
          method: 'POST',
          query: { clientId: 'client1' },
          body: { messages: ['for-client1'] },
        }),
        createMockRes()
      )

      handler(
        createMockReq({
          method: 'POST',
          query: { clientId: 'client2' },
          body: { messages: ['for-client2'] },
        }),
        createMockRes()
      )

      const getRes1 = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: { clientId: 'client1' },
        }),
        getRes1
      )

      const getRes2 = createMockRes()
      handler(
        createMockReq({
          method: 'GET',
          query: { clientId: 'client2' },
        }),
        getRes2
      )

      const msgs1 = (getRes1._json as { messages: unknown[] }).messages
      const msgs2 = (getRes2._json as { messages: unknown[] }).messages
      expect(msgs1).toHaveLength(1)
      expect(msgs2).toHaveLength(1)
      expect(msgs1[0]).toEqual(
        expect.objectContaining({ message: 'for-client1' })
      )
      expect(msgs2[0]).toEqual(
        expect.objectContaining({ message: 'for-client2' })
      )
    })
  })
})
