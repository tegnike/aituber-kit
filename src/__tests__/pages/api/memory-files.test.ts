/**
 * memory-files API Tests
 */

import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/memory-files'
import { NextApiRequest, NextApiResponse } from 'next'

// fs モジュールをモック
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}))

import fs from 'fs'

const mockFs = fs as jest.Mocked<typeof fs>

describe('/api/memory-files', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('通常モード時の動作', () => {
    it('logsディレクトリが存在しない場合は空配列を返す', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.files).toEqual([])
    })

    it('ログファイル一覧を返す', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readdirSync.mockReturnValue([
        'log_2024-01-01T12-00-00.json',
      ] as any)
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify([{ role: 'user', content: 'test' }])
      )

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.files).toHaveLength(1)
      expect(data.files[0].filename).toBe('log_2024-01-01T12-00-00.json')
    })

    it('GETメソッド以外は405エラーを返す', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })
})
