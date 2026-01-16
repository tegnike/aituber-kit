/**
 * Embedding API Endpoint Tests
 *
 * /api/embedding エンドポイントのユニットテスト
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'

// OpenAI モジュールのモック
const mockCreate = jest.fn()
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: mockCreate,
      },
    })),
  }
})

// 環境変数をモックするためのヘルパー
const originalEnv = process.env

describe('/api/embedding', () => {
  let handler: typeof import('@/pages/api/embedding').default

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  const importHandler = async () => {
    const apiModule = await import('@/pages/api/embedding')
    return apiModule.default
  }

  describe('正常系', () => {
    it('テキストをベクトル化して1536次元のembeddingを返す', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key'
      const mockEmbedding = new Array(1536).fill(0.1)
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { text: 'こんにちは' },
      })

      handler = await importHandler()

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.embedding).toHaveLength(1536)
      expect(data.model).toBe('text-embedding-3-small')
      expect(data.usage).toEqual({ prompt_tokens: 10, total_tokens: 10 })
    })

    it('リクエストボディからapiKeyを受け取ってOpenAI APIを呼び出す', async () => {
      // Arrange
      const customApiKey = 'custom-api-key'
      const mockEmbedding = new Array(1536).fill(0.2)
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 5, total_tokens: 5 },
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { text: 'テスト', apiKey: customApiKey },
      })

      handler = await importHandler()

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(200)
      const OpenAI = (await import('openai')).default
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: customApiKey })
    })
  })

  describe('エラーハンドリング', () => {
    it('POSTメソッド以外は405エラーを返す', async () => {
      // Arrange
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      handler = await importHandler()

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Method not allowed')
    })

    it('textパラメータがない場合は400エラーを返す', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key'
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {},
      })

      handler = await importHandler()

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Missing required parameter: text')
      expect(data.code).toBe('INVALID_INPUT')
    })

    it('APIキーが設定されていない場合は401エラーを返す', async () => {
      // Arrange
      delete process.env.OPENAI_API_KEY
      delete process.env.OPENAI_EMBEDDING_KEY
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { text: 'テスト' },
      })

      handler = await importHandler()

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('OpenAI API key is not configured')
      expect(data.code).toBe('API_KEY_MISSING')
    })

    it('OpenAI APIからレート制限エラーが返された場合は429エラーを返す', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key'
      const rateLimitError = new Error('Rate limit exceeded')
      ;(rateLimitError as any).status = 429
      mockCreate.mockRejectedValue(rateLimitError)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { text: 'テスト' },
      })

      handler = await importHandler()

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(429)
      const data = JSON.parse(res._getData())
      expect(data.code).toBe('RATE_LIMITED')
    })

    it('OpenAI API呼び出しが失敗した場合は500エラーを返す', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key'
      mockCreate.mockRejectedValue(new Error('API error'))

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { text: 'テスト' },
      })

      handler = await importHandler()

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(500)
      const data = JSON.parse(res._getData())
      expect(data.code).toBe('API_ERROR')
    })
  })

  describe('モデル指定', () => {
    it('text-embedding-3-smallモデルを使用してEmbedding APIを呼び出す', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-api-key'
      const mockEmbedding = new Array(1536).fill(0.1)
      mockCreate.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 10, total_tokens: 10 },
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: { text: 'テスト' },
      })

      handler = await importHandler()

      // Act
      await handler(req, res)

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'テスト',
      })
    })
  })
})
