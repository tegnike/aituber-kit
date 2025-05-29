/**
 * IndexedDB utility for storing Live2D Cubism Core files
 */

interface Live2DCoreFile {
  id: string
  fileName: string
  fileContent: ArrayBuffer
  uploadDate: Date
  fileSize: number
  version?: string
}

const DB_NAME = 'AITuberKitDB'
const DB_VERSION = 1
const STORE_NAME = 'live2dCoreFiles'
const CORE_FILE_ID = 'cubism-core'

class Live2DStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null
  private activeBlobURLs: Set<string> = new Set()

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    if (this.db) {
      return Promise.resolve()
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        this.initPromise = null
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result

        this.db.onclose = () => {
          this.db = null
          this.initPromise = null
        }

        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('fileName', 'fileName', { unique: false })
          store.createIndex('uploadDate', 'uploadDate', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  async saveCoreFile(file: File): Promise<void> {
    if (!this.db) await this.init()

    const arrayBuffer = await file.arrayBuffer()
    const coreFile: Live2DCoreFile = {
      id: CORE_FILE_ID,
      fileName: file.name,
      fileContent: arrayBuffer,
      uploadDate: new Date(),
      fileSize: file.size,
      version: '1.0.0',
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')

      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(new Error('Transaction aborted'))

      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(coreFile)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getCoreFile(): Promise<Live2DCoreFile | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')

      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(new Error('Transaction aborted'))

      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(CORE_FILE_ID)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async deleteCoreFile(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')

      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(new Error('Transaction aborted'))

      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(CORE_FILE_ID)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async hasCoreFile(): Promise<boolean> {
    try {
      const file = await this.getCoreFile()
      return file !== null
    } catch (error) {
      console.error('Error checking core file existence:', error)
      return false
    }
  }

  createBlobURL(arrayBuffer: ArrayBuffer): string {
    const blob = new Blob([arrayBuffer], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    this.activeBlobURLs.add(url)
    return url
  }

  revokeBlobURL(url: string): void {
    if (this.activeBlobURLs.has(url)) {
      URL.revokeObjectURL(url)
      this.activeBlobURLs.delete(url)
    }
  }

  revokeAllBlobURLs(): void {
    this.activeBlobURLs.forEach((url) => {
      URL.revokeObjectURL(url)
    })
    this.activeBlobURLs.clear()
  }

  cleanup(): void {
    // すべてのBlobURLを削除
    this.revokeAllBlobURLs()

    if (this.db) {
      this.db.close()
      this.db = null
    }
    this.initPromise = null
  }
}

// ファイル検証機能
export const validateCubismCoreFile = (
  file: File
): { isValid: boolean; error?: string } => {
  // ファイル名チェック
  if (!file.name.toLowerCase().includes('live2dcubismcore')) {
    return {
      isValid: false,
      error: 'ファイル名にlive2dcubismcoreが含まれている必要があります',
    }
  }

  // 拡張子チェック
  if (!file.name.toLowerCase().endsWith('.js')) {
    return {
      isValid: false,
      error: 'JavaScriptファイル（.js）である必要があります',
    }
  }

  // ファイルサイズチェック（100KB〜10MB）
  if (file.size < 100000) {
    return {
      isValid: false,
      error: 'ファイルサイズが小さすぎます（最小100KB）',
    }
  }

  if (file.size > 10000000) {
    return { isValid: false, error: 'ファイルサイズが大きすぎます（最大10MB）' }
  }

  // MIMEタイプチェック
  const validTypes = ['application/javascript', 'text/javascript', 'text/plain']
  if (!file.type || !validTypes.includes(file.type)) {
    return { isValid: false, error: 'JavaScriptファイルではありません' }
  }

  return { isValid: true }
}

// シングルトンインスタンス
export const live2dStorage = new Live2DStorage()
