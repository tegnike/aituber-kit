/**
 * MemoryService - Core Memory Functionality
 *
 * メモリ機能の中核サービス
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 5.4, 5.5
 */

import {
  MemoryRecord,
  SearchOptions,
  cosineSimilarity,
  EMBEDDING_DIMENSION,
} from './memoryTypes'
import { MemoryStore, isIndexedDBSupported } from './memoryStore'

/**
 * メッセージの入力型
 */
export interface Message {
  role: 'user' | 'assistant'
  content: string
}

/**
 * 検索結果に類似度スコアを追加した型
 */
export interface MemorySearchResult extends MemoryRecord {
  similarity?: number
}

/**
 * Embedding APIのレスポンス型
 */
interface EmbeddingResponse {
  embedding: number[]
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

/**
 * Embedding APIのエラーレスポンス型
 */
interface EmbeddingError {
  error: string
  code: 'INVALID_INPUT' | 'API_KEY_MISSING' | 'RATE_LIMITED' | 'API_ERROR'
}

/**
 * MemoryService - メモリ機能の中核サービス
 *
 * 責務:
 * - メッセージのEmbedding取得とIndexedDB保存を統括
 * - コサイン類似度によるメモリ検索
 * - 既存chatLogとの互換性維持
 */
export class MemoryService {
  private store: MemoryStore
  private initialized: boolean = false
  private sessionId: string

  constructor() {
    this.store = new MemoryStore()
    this.sessionId = this.generateSessionId()
  }

  /**
   * セッションIDを生成する
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  /**
   * メモリ機能を初期化する
   *
   * IndexedDBを開き、利用可能な状態にする
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    if (!isIndexedDBSupported()) {
      console.warn('MemoryService: IndexedDB is not supported in this browser')
      return
    }

    try {
      await this.store.open()
      this.initialized = true
    } catch (error) {
      console.error('MemoryService: Failed to initialize', error)
    }
  }

  /**
   * メモリ機能が利用可能か確認する
   *
   * @returns IndexedDBが初期化済みで利用可能な場合はtrue
   */
  isAvailable(): boolean {
    return this.initialized
  }

  /**
   * メッセージをベクトル化して保存する
   *
   * Embedding API呼び出しが失敗した場合でも、メッセージは保存される（embeddingはnull）
   * 会話は中断されず、エラーはログに記録される（Requirement 1.4）
   *
   * @param message - 保存するメッセージ
   */
  async saveMemory(message: Message): Promise<void> {
    if (!this.initialized) {
      console.warn('MemoryService: Not initialized, skipping save')
      return
    }

    let embedding: number[] | null = null

    // Embedding APIを呼び出す
    try {
      embedding = await this.getEmbedding(message.content)
    } catch (error) {
      // エラーをログに記録し、会話は継続（Requirement 1.4）
      console.warn(
        'MemoryService: Failed to get embedding, saving without embedding',
        error
      )
    }

    // メモリレコードを作成して保存
    const record: MemoryRecord = {
      id: this.generateRecordId(),
      role: message.role,
      content: message.content,
      embedding,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    }

    try {
      await this.store.put(record)
    } catch (error) {
      console.error('MemoryService: Failed to save memory record', error)
    }
  }

  /**
   * 関連するメモリを検索する
   *
   * クエリをベクトル化し、保存済みメモリとのコサイン類似度を計算して
   * 閾値以上のメモリを類似度順にソートして返す
   *
   * @param query - 検索クエリ
   * @param options - 検索オプション（閾値、件数上限）
   * @returns 類似度順にソートされたメモリレコード配列
   */
  async searchMemories(
    query: string,
    options: SearchOptions = {}
  ): Promise<MemorySearchResult[]> {
    if (!this.initialized) return []

    const { threshold = 0.7, limit = 5 } = options

    // クエリのEmbeddingを取得
    const queryEmbedding = await this.getEmbedding(query).catch((error) => {
      console.warn('MemoryService: Failed to get query embedding', error)
      return null
    })

    if (!queryEmbedding) return []

    // 全メモリを取得して類似度計算
    const allMemories = await this.store.getAll()
    const results: MemorySearchResult[] = []

    for (const memory of allMemories) {
      if (!memory.embedding) continue

      try {
        const similarity = cosineSimilarity(queryEmbedding, memory.embedding)
        if (similarity >= threshold) {
          results.push({ ...memory, similarity })
        }
      } catch (error) {
        console.warn('MemoryService: Similarity calculation failed', error)
      }
    }

    // 類似度の降順でソートして件数上限を適用
    return results
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
      .slice(0, limit)
  }

  /**
   * 全メモリを削除する
   */
  async clearAllMemories(): Promise<void> {
    if (!this.initialized) return
    await this.store.clear()
  }

  /**
   * メモリレコードを直接保存する（復元用）
   *
   * Embedding APIを呼び出さずに、既存のEmbeddingを含むレコードを保存する
   *
   * @param record - 保存するメモリレコード
   */
  async restoreMemory(record: MemoryRecord): Promise<void> {
    if (!this.initialized) {
      console.warn('MemoryService: Not initialized, skipping restore')
      return
    }

    try {
      await this.store.put(record)
    } catch (error) {
      console.error('MemoryService: Failed to restore memory record', error)
    }
  }

  /**
   * 複数のメモリレコードを一括で復元する
   *
   * @param records - 復元するメモリレコード配列
   * @returns 復元に成功したレコード数
   */
  async restoreMemories(records: MemoryRecord[]): Promise<number> {
    if (!this.initialized) {
      console.warn('MemoryService: Not initialized, skipping restore')
      return 0
    }

    let restoredCount = 0

    for (const record of records) {
      try {
        await this.store.put(record)
        restoredCount++
      } catch (error) {
        console.error('MemoryService: Failed to restore memory record', error)
      }
    }

    return restoredCount
  }

  /**
   * 保存済みメモリ件数を取得する
   *
   * @returns メモリ件数
   */
  async getMemoryCount(): Promise<number> {
    if (!this.initialized) return 0
    return this.store.count()
  }

  /**
   * テキストのEmbeddingを取得する（公開API）
   *
   * ローカルファイル保存時にEmbeddingを付与するために使用
   *
   * @param text - ベクトル化するテキスト
   * @returns Embeddingベクトル（失敗時はnull）
   */
  async fetchEmbedding(text: string): Promise<number[] | null> {
    return this.getEmbedding(text)
  }

  /**
   * テキストのEmbeddingを取得する
   *
   * @param text - ベクトル化するテキスト
   * @returns Embeddingベクトル（失敗時はnull）
   */
  private async getEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await fetch('/api/embedding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = (await response.json()) as EmbeddingError
        console.warn('MemoryService: Embedding API error', errorData)
        return null
      }

      const data = (await response.json()) as EmbeddingResponse

      // Embedding次元数の検証
      if (data.embedding.length !== EMBEDDING_DIMENSION) {
        console.warn(
          `MemoryService: Unexpected embedding dimension: ${data.embedding.length}`
        )
      }

      return data.embedding
    } catch (error) {
      console.warn('MemoryService: Embedding API request failed', error)
      return null
    }
  }

  /**
   * レコードIDを生成する
   */
  private generateRecordId(): string {
    return `memory-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }
}

/**
 * MemoryServiceのシングルトンインスタンス
 * アプリケーション全体で共有される
 */
let memoryServiceInstance: MemoryService | null = null

/**
 * MemoryServiceのシングルトンインスタンスを取得する
 *
 * @returns MemoryServiceインスタンス
 */
export function getMemoryService(): MemoryService {
  if (!memoryServiceInstance) {
    memoryServiceInstance = new MemoryService()
  }
  return memoryServiceInstance
}

/**
 * MemoryServiceのシングルトンインスタンスをリセットする
 * 主にテスト用
 */
export function resetMemoryService(): void {
  memoryServiceInstance = null
}
