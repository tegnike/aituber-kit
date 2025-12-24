/**
 * save-chat-log API Tests
 */

import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/save-chat-log'
import { NextApiRequest, NextApiResponse } from 'next'

// fs モジュールをモック
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readdirSync: jest.fn(),
}))

// Supabaseモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => null),
}))

// デモモードユーティリティをモック
jest.mock('@/utils/demoMode', () => ({
  isDemoMode: jest.fn(),
  createDemoModeErrorResponse: jest.fn((featureName: string) => ({
    error: 'feature_disabled_in_demo_mode',
    message: `The feature "${featureName}" is disabled in demo mode.`,
  })),
}))

import fs from 'fs'
import { isDemoMode } from '@/utils/demoMode'

const mockFs = fs as jest.Mocked<typeof fs>
const mockIsDemoMode = isDemoMode as jest.MockedFunction<typeof isDemoMode>

describe('/api/save-chat-log', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsDemoMode.mockReturnValue(false)
  })

  describe('デモモード時の動作', () => {
    it('デモモード時は403エラーを返す', async () => {
      mockIsDemoMode.mockReturnValue(true)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          messages: [{ role: 'user', content: 'test' }],
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(403)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('feature_disabled_in_demo_mode')
    })
  })

  describe('通常モード時の動作', () => {
    it('POSTリクエストでメッセージを保存できる', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readdirSync.mockReturnValue([
        'log_2024-01-01T12-00-00.json',
      ] as any)
      mockFs.readFileSync.mockReturnValue('[]')
      mockFs.writeFileSync.mockImplementation()

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          messages: [{ role: 'user', content: 'test message' }],
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('POSTメソッド以外は405エラーを返す', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('空のメッセージ配列は400エラーを返す', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          messages: [],
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })
  })
})
