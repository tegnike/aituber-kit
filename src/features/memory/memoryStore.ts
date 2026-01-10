/**
 * MemoryStore - IndexedDB Storage Layer
 *
 * IndexedDBを使用してメモリレコードを永続化するストレージクラス
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { openDB, IDBPDatabase } from 'idb'
import { MemoryRecord } from './memoryTypes'

/** データベース名 */
export const DB_NAME = 'aituber-memory'

/** データベースバージョン */
export const DB_VERSION = 1

/** オブジェクトストア名 */
export const STORE_NAME = 'memories'

/**
 * ブラウザがIndexedDBをサポートしているか確認する
 *
 * @returns IndexedDBが利用可能な場合はtrue
 */
export function isIndexedDBSupported(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.indexedDB)
  } catch {
    return false
  }
}

/**
 * IndexedDBスキーマ定義
 */
interface MemoryDB {
  memories: {
    key: string
    value: MemoryRecord
    indexes: {
      sessionId: string
      timestamp: string
    }
  }
}

/**
 * MemoryStore - IndexedDBへのCRUD操作をラップ
 *
 * 責務:
 * - idbライブラリを使用したIndexedDB操作
 * - スキーマバージョン管理
 * - データベース「aituber-memory」の管理
 */
export class MemoryStore {
  private db: IDBPDatabase<MemoryDB> | null = null

  /**
   * データベースを開く/作成する
   *
   * @throws IndexedDBが利用できない場合にエラー
   */
  async open(): Promise<void> {
    if (this.db) return

    this.db = await openDB<MemoryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // memories オブジェクトストアが存在しない場合のみ作成
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          // セッション別検索用インデックス
          store.createIndex('sessionId', 'sessionId')
          // 時系列ソート用インデックス
          store.createIndex('timestamp', 'timestamp')
        }
      },
    })
  }

  /**
   * データベース接続を閉じる
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * データベースが開いているか確認
   */
  private ensureOpen(): void {
    if (!this.db) {
      throw new Error('MemoryStore is not open. Call open() first.')
    }
  }

  /**
   * メモリレコードを保存する
   *
   * @param record - 保存するメモリレコード
   */
  async put(record: MemoryRecord): Promise<void> {
    this.ensureOpen()
    await this.db!.put(STORE_NAME, record)
  }

  /**
   * 全レコードを取得する
   *
   * @returns 保存されている全てのメモリレコード
   */
  async getAll(): Promise<MemoryRecord[]> {
    this.ensureOpen()
    return await this.db!.getAll(STORE_NAME)
  }

  /**
   * セッションIDでフィルタして取得する
   *
   * @param sessionId - フィルタするセッションID
   * @returns 指定セッションのメモリレコード
   */
  async getBySessionId(sessionId: string): Promise<MemoryRecord[]> {
    this.ensureOpen()
    return await this.db!.getAllFromIndex(STORE_NAME, 'sessionId', sessionId)
  }

  /**
   * 直近N件のメッセージを取得する（chatLog互換）
   *
   * @param limit - 取得する最大件数
   * @returns タイムスタンプ降順でソートされたメモリレコード
   */
  async getRecentMessages(limit: number): Promise<MemoryRecord[]> {
    this.ensureOpen()

    // 全レコードを取得してタイムスタンプでソート
    const allRecords = await this.db!.getAll(STORE_NAME)

    // タイムスタンプ降順（新しい順）でソート
    allRecords.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      return timeB - timeA
    })

    // 上限まで返却
    return allRecords.slice(0, limit)
  }

  /**
   * 全レコードを削除する
   */
  async clear(): Promise<void> {
    this.ensureOpen()
    await this.db!.clear(STORE_NAME)
  }

  /**
   * レコード件数を取得する
   *
   * @returns 保存されているレコードの件数
   */
  async count(): Promise<number> {
    this.ensureOpen()
    return await this.db!.count(STORE_NAME)
  }
}
