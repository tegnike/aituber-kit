/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/tts-voicevox'

// axios mock
jest.mock('axios', () => ({
  post: jest.fn(),
}))

const mockAxios = require('axios')

describe('/api/tts-voicevox', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Demo Mode', () => {
    it('should return 403 when demo mode is enabled', async () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true'

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          text: 'こんにちは',
          speaker: 1,
          speed: 1.0,
          pitch: 0,
          intonation: 1.0,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('feature_disabled_in_demo_mode')
      expect(data.message).toContain('voicevox')
    })

    it('should process request when demo mode is disabled', async () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'false'

      const mockPipe = jest.fn()
      mockAxios.post
        .mockResolvedValueOnce({
          data: { speedScale: 1, pitchScale: 0, intonationScale: 1 },
        })
        .mockResolvedValueOnce({
          data: { pipe: mockPipe },
        })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          text: 'こんにちは',
          speaker: 1,
          speed: 1.0,
          pitch: 0,
          intonation: 1.0,
        },
      })

      await handler(req, res)

      expect(mockAxios.post).toHaveBeenCalled()
    })

    it('should process request when demo mode is not set', async () => {
      delete process.env.NEXT_PUBLIC_DEMO_MODE

      const mockPipe = jest.fn()
      mockAxios.post
        .mockResolvedValueOnce({
          data: { speedScale: 1, pitchScale: 0, intonationScale: 1 },
        })
        .mockResolvedValueOnce({
          data: { pipe: mockPipe },
        })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          text: 'こんにちは',
          speaker: 1,
          speed: 1.0,
          pitch: 0,
          intonation: 1.0,
        },
      })

      await handler(req, res)

      expect(mockAxios.post).toHaveBeenCalled()
    })
  })
})
