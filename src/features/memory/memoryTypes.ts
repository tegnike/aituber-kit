/**
 * Memory Types and Utility Functions
 *
 * RAGベースのメモリ機能で使用する型定義とユーティリティ関数
 */

/**
 * OpenAI text-embedding-3-small のEmbedding次元数
 */
export const EMBEDDING_DIMENSION = 1536

/**
 * メモリレコードの型定義
 * IndexedDBに保存されるメッセージとEmbeddingの組み合わせ
 */
export interface MemoryRecord {
  /** 一意識別子 */
  id: string
  /** メッセージの送信者 */
  role: 'user' | 'assistant'
  /** メッセージ内容 */
  content: string
  /** Embeddingベクトル（未取得時はnull） */
  embedding: number[] | null
  /** タイムスタンプ（ISO 8601形式） */
  timestamp: string
  /** セッションID */
  sessionId: string
}

/**
 * 検索オプションの型定義
 */
export interface SearchOptions {
  /** 類似度閾値 (0.0-1.0) */
  threshold?: number
  /** 最大検索件数 */
  limit?: number
}

/**
 * メモリ設定の型定義
 * settingsStoreに保存される設定値
 */
export interface MemoryConfig {
  /** メモリ機能の有効/無効 */
  memoryEnabled: boolean
  /** 類似度閾値 (0.1-0.95) */
  memorySimilarityThreshold: number
  /** 検索結果上限 (1-10) */
  memorySearchLimit: number
  /** コンテキスト最大トークン数 */
  memoryMaxContextTokens: number
}

/**
 * デフォルトのメモリ設定
 */
export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  memoryEnabled: false,
  memorySimilarityThreshold: 0.7,
  memorySearchLimit: 5,
  memoryMaxContextTokens: 1000,
}

/**
 * コサイン類似度を計算する
 *
 * @param vectorA - 比較元ベクトル
 * @param vectorB - 比較先ベクトル
 * @returns コサイン類似度 (-1.0 〜 1.0)
 * @throws ベクトルの長さが異なる場合にエラー
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error(
      `Vector length mismatch: ${vectorA.length} vs ${vectorB.length}`
    )
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    normA += vectorA[i] * vectorA[i]
    normB += vectorB[i] * vectorB[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)

  // ゼロベクトルの場合は0を返す
  if (magnitude === 0) {
    return 0
  }

  return dotProduct / magnitude
}
