/**
 * Embedding API Endpoint
 *
 * OpenAI Embedding APIへのプロキシエンドポイント
 * Requirements: 1.1, 1.3, 1.4, 1.5
 */

import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

/** Embeddingモデル名 */
const EMBEDDING_MODEL = 'text-embedding-3-small'

/** Embeddingレスポンスの型 */
interface EmbeddingResponse {
  embedding: number[]
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

/** エラーレスポンスの型 */
interface EmbeddingError {
  error: string
  code: 'INVALID_INPUT' | 'API_KEY_MISSING' | 'RATE_LIMITED' | 'API_ERROR'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EmbeddingResponse | EmbeddingError>
) {
  // POSTメソッド以外は拒否
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      code: 'INVALID_INPUT',
    })
  }

  const { text, apiKey } = req.body

  // textパラメータの検証
  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      error: 'Missing required parameter: text',
      code: 'INVALID_INPUT',
    })
  }

  // APIキーの取得（リクエスト > 環境変数の優先順位）
  const openaiKey =
    apiKey || process.env.OPENAI_EMBEDDING_KEY || process.env.OPENAI_API_KEY

  // APIキーの存在確認
  if (!openaiKey) {
    return res.status(401).json({
      error: 'OpenAI API key is not configured',
      code: 'API_KEY_MISSING',
    })
  }

  try {
    const openai = new OpenAI({ apiKey: openaiKey })

    // Embedding APIを呼び出し
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    })

    // レスポンスを返却
    return res.status(200).json({
      embedding: response.data[0].embedding,
      model: response.model,
      usage: {
        prompt_tokens: response.usage.prompt_tokens,
        total_tokens: response.usage.total_tokens,
      },
    })
  } catch (error: any) {
    // エラーログを出力
    console.error('Embedding API error:', error)

    // レート制限エラー
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMITED',
      })
    }

    // その他のAPIエラー
    return res.status(500).json({
      error: 'Failed to generate embedding',
      code: 'API_ERROR',
    })
  }
}
