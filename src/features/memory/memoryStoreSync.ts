/**
 * MemoryStoreSync - Synchronization between homeStore and MemoryService
 *
 * homeStoreのchatLog変更を監視し、MemoryServiceへメッセージを保存する
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */

import { Message } from '@/features/messages/messages'
import { getMemoryService } from './memoryService'
import { MemoryContextBuilder } from './memoryContextBuilder'
import settingsStore from '@/features/stores/settings'

/**
 * メッセージをMemoryServiceに保存する
 *
 * メモリ機能が有効な場合のみ保存を実行する
 * エラーが発生しても会話を中断しない（graceful degradation）
 *
 * @param message - 保存するメッセージ
 */
export async function saveMessageToMemory(message: Message): Promise<void> {
  const { memoryEnabled } = settingsStore.getState()
  if (!memoryEnabled) return

  const memoryService = getMemoryService()
  if (!memoryService.isAvailable()) return

  // roleがuserまたはassistantの場合のみ保存
  if (message.role !== 'user' && message.role !== 'assistant') return

  const content = extractTextContent(message.content)
  if (!content) return

  try {
    await memoryService.saveMemory({
      role: message.role as 'user' | 'assistant',
      content,
    })
  } catch (error) {
    console.warn('MemoryStoreSync: Failed to save message to memory', error)
  }
}

/**
 * 関連するメモリを検索してコンテキストを構築する
 *
 * @param query - 検索クエリ（通常はユーザーメッセージ）
 * @returns システムプロンプトに追加するコンテキスト文字列
 */
export async function searchMemoryContext(query: string): Promise<string> {
  // 空/空白のみのクエリをスキップ
  if (!query || !query.trim()) return ''

  const ss = settingsStore.getState()
  if (!ss.memoryEnabled) return ''

  const memoryService = getMemoryService()
  if (!memoryService.isAvailable()) return ''

  try {
    const memories = await memoryService.searchMemories(query, {
      threshold: ss.memorySimilarityThreshold,
      limit: ss.memorySearchLimit,
    })

    if (memories.length === 0) return ''

    const builder = new MemoryContextBuilder()
    return builder.buildContext(memories, {
      maxTokens: ss.memoryMaxContextTokens,
    })
  } catch (error) {
    console.warn('MemoryStoreSync: Failed to search memory context', error)
    return ''
  }
}

/**
 * MemoryServiceを初期化する
 *
 * アプリケーション起動時に呼び出す
 */
export async function initializeMemoryService(): Promise<void> {
  const { memoryEnabled } = settingsStore.getState()
  if (!memoryEnabled) {
    console.log('MemoryStoreSync: Memory feature is disabled')
    return
  }

  try {
    const memoryService = getMemoryService()
    await memoryService.initialize()
    console.log('MemoryStoreSync: Memory service initialized successfully')
  } catch (error) {
    console.warn('MemoryStoreSync: Failed to initialize memory service', error)
  }
}

/**
 * メッセージコンテンツからテキストを抽出する
 *
 * マルチモーダルメッセージの場合はテキスト部分のみを抽出
 *
 * @param content - メッセージコンテンツ
 * @returns 抽出されたテキスト
 */
export function extractTextContent(content: Message['content']): string {
  if (typeof content === 'string') {
    return content
  }

  // マルチモーダルコンテンツの場合
  if (Array.isArray(content)) {
    const textParts = content
      .filter(
        (part): part is { type: 'text'; text: string } => part.type === 'text'
      )
      .map((part) => part.text)

    return textParts.join(' ')
  }

  return ''
}

/**
 * メッセージにEmbeddingを付与する
 *
 * ローカルファイル保存時にEmbeddingを含めて保存するために使用
 *
 * @param message - Embeddingを付与するメッセージ
 * @returns Embeddingを付与したメッセージ（失敗時は元のメッセージ）
 */
export async function addEmbeddingToMessage(
  message: Message
): Promise<Message> {
  const { memoryEnabled } = settingsStore.getState()
  if (!memoryEnabled) return message
  if (message.role !== 'user' && message.role !== 'assistant') return message

  const content = extractTextContent(message.content)
  if (!content) return message

  try {
    const memoryService = getMemoryService()
    const embedding = await memoryService.fetchEmbedding(content)
    if (embedding) {
      return { ...message, embedding }
    }
  } catch (error) {
    console.warn('Failed to fetch embedding for message:', error)
  }

  return message
}

/**
 * 複数のメッセージにEmbeddingを付与する
 *
 * @param messages - Embeddingを付与するメッセージ配列
 * @returns Embeddingを付与したメッセージ配列
 */
export async function addEmbeddingsToMessages(
  messages: Message[]
): Promise<Message[]> {
  const { memoryEnabled } = settingsStore.getState()
  if (!memoryEnabled) return messages
  return Promise.all(messages.map(addEmbeddingToMessage))
}

/**
 * MemoryFileInfo型
 */
export interface MemoryFileInfo {
  filename: string
  createdAt: string
  messageCount: number
  hasEmbeddings: boolean
}

/**
 * ローカルファイル一覧を取得する
 *
 * @returns ファイル情報の配列
 */
export async function getMemoryFiles(): Promise<MemoryFileInfo[]> {
  try {
    const response = await fetch('/api/memory-files')

    if (!response.ok) {
      console.error('Failed to fetch memory files:', response.statusText)
      return []
    }

    const data = (await response.json()) as { files: MemoryFileInfo[] }
    return data.files
  } catch (error) {
    console.error('Error fetching memory files:', error)
    return []
  }
}

/** 復元失敗時のデフォルト結果 */
const RESTORE_FAILURE = { success: false, restoredCount: 0, embeddingCount: 0 }

/**
 * ローカルファイルからメモリを復元する
 *
 * @param filename - 復元するファイル名
 * @returns 復元結果
 */
export async function restoreMemoryFromFile(filename: string): Promise<{
  success: boolean
  restoredCount: number
  embeddingCount: number
}> {
  const { memoryEnabled } = settingsStore.getState()
  if (!memoryEnabled) return RESTORE_FAILURE

  try {
    const response = await fetch('/api/memory-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })

    if (!response.ok) {
      console.error('Failed to restore memory:', response.statusText)
      return RESTORE_FAILURE
    }

    const data = (await response.json()) as {
      messages: Message[]
      restoredCount: number
      embeddingCount: number
    }

    const memoryService = getMemoryService()
    if (!memoryService.isAvailable()) {
      await memoryService.initialize()
    }

    let actualRestoredCount = 0

    for (const message of data.messages) {
      if (message.role !== 'user' && message.role !== 'assistant') continue

      const content = extractTextContent(message.content)
      if (!content) continue

      await memoryService.restoreMemory({
        id: `restored-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        sessionId: 'restored',
        role: message.role as 'user' | 'assistant',
        content,
        timestamp: message.timestamp || new Date().toISOString(),
        embedding: message.embedding || null,
      })
      actualRestoredCount++
    }

    console.log(
      `MemoryStoreSync: Restored ${actualRestoredCount} memories from ${filename}`
    )

    return {
      success: true,
      restoredCount: actualRestoredCount,
      embeddingCount: data.embeddingCount,
    }
  } catch (error) {
    console.error('Error restoring memory from file:', error)
    return RESTORE_FAILURE
  }
}
