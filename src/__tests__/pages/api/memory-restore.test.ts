/**
 * memory-restore API Tests
 */

import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/memory-restore'
import { NextApiRequest, NextApiResponse } from 'next'

// fs モジュールをモック
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}))

import fs from 'fs'

const mockFs = fs as jest.Mocked<typeof fs>

describe('/api/memory-restore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('通常モード時の動作', () => {
    it('メモリファイルを復元できる', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify([{ role: 'user', content: 'test' }])
      )

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          filename: 'log_2024-01-01T12-00-00.json',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.restoredCount).toBe(1)
    })

    it('POSTメソッド以外は405エラーを返す', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('ファイル名が指定されていない場合は400エラーを返す', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {},
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('パストラバーサル攻撃を防止する', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          filename: '../../../etc/passwd',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('存在しないファイルは404エラーを返す', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          filename: 'nonexistent.json',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
    })
  })
})
