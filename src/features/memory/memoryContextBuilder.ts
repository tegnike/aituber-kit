/**
 * MemoryContextBuilder - LLM Context Building Service
 *
 * 検索結果をLLMコンテキストに変換するサービス
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { MemoryRecord } from './memoryTypes'

/**
 * コンテキスト構築オプション
 */
export interface ContextOptions {
  /** 最大トークン数（デフォルト: 1000） */
  maxTokens?: number
  /** 記憶のフォーマット（デフォルト: 'detailed'） */
  format?: 'detailed' | 'compact'
}

/**
 * デフォルトの最大トークン数
 */
const DEFAULT_MAX_TOKENS = 1000

/**
 * タイムスタンプをJST形式にフォーマットする
 *
 * @param isoTimestamp - ISO 8601形式のタイムスタンプ
 * @returns [YYYY/MM/DD HH:mm]形式の文字列
 */
export function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)

  // 無効な日付の場合はフォールバック
  if (isNaN(date.getTime())) {
    return '[不明]'
  }

  // JSTに変換（UTC+9）
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)

  const year = jstDate.getUTCFullYear()
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(jstDate.getUTCDate()).padStart(2, '0')
  const hours = String(jstDate.getUTCHours()).padStart(2, '0')
  const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0')

  return `[${year}/${month}/${day} ${hours}:${minutes}]`
}

/**
 * MemoryContextBuilder - メモリ配列をLLMコンテキストに変換
 *
 * 責務:
 * - MemoryRecord配列をシステムプロンプト用テキストに変換
 * - トークン上限を考慮した記憶の選択
 * - 日時フォーマット整形
 */
export class MemoryContextBuilder {
  /**
   * メモリ配列をコンテキスト文字列に変換する
   *
   * @param memories - メモリレコード配列（timestamp順にソート済みを想定）
   * @param options - 変換オプション
   * @returns システムプロンプトに追加するコンテキスト文字列
   */
  buildContext(memories: MemoryRecord[], options: ContextOptions = {}): string {
    // 空配列の場合は空文字列を返す（Requirement 4.4）
    if (memories.length === 0) {
      return ''
    }

    const { maxTokens = DEFAULT_MAX_TOKENS, format = 'detailed' } = options

    // タイムスタンプでソート（古い順）
    const sortedMemories = [...memories].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // 各メモリをフォーマット
    const formattedMemories = sortedMemories.map((memory) =>
      this.formatMemory(memory, format)
    )

    // ヘッダーを追加
    const header = '## 過去の記憶\n以下はユーザーとの過去の会話の記録です。\n\n'

    // トークン上限を超えないよう調整（古い記憶から削除）
    return this.truncateToTokenLimit(header, formattedMemories, maxTokens)
  }

  /**
   * テキストのトークン数を推定する
   *
   * OpenAI のトークナイザーに近い推定を行う
   * - 英語: 約4文字 = 1トークン
   * - 日本語: 約1.5文字 = 1トークン
   *
   * @param text - 推定対象のテキスト
   * @returns 推定トークン数
   */
  estimateTokens(text: string): number {
    if (!text) return 0

    // 日本語文字のカウント（ひらがな、カタカナ、漢字）
    const japaneseCount =
      text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g)?.length ?? 0

    // ASCII文字のカウント
    const asciiCount = text.match(/[\x00-\x7F]/g)?.length ?? 0

    // その他の文字（絵文字など）
    const otherCount = text.length - japaneseCount - asciiCount

    // トークン推定
    // 日本語: 約1.5文字で1トークン
    // ASCII: 約4文字で1トークン
    // その他: 1文字で1トークン
    const estimatedTokens =
      Math.ceil(japaneseCount / 1.5) + Math.ceil(asciiCount / 4) + otherCount

    return Math.max(1, estimatedTokens)
  }

  /**
   * メモリレコードをフォーマットする
   *
   * @param memory - メモリレコード
   * @param format - フォーマット種別
   * @returns フォーマットされた文字列
   */
  private formatMemory(
    memory: MemoryRecord,
    format: 'detailed' | 'compact'
  ): string {
    const roleLabel = memory.role === 'user' ? 'ユーザー' : 'キャラクター'

    if (format === 'compact') {
      // compactフォーマット: 日時を省略
      return `${roleLabel}: ${memory.content}`
    }

    // detailedフォーマット: 日時を含む（Requirement 4.2）
    const timestamp = formatTimestamp(memory.timestamp)
    return `${timestamp} ${roleLabel}: ${memory.content}`
  }

  /**
   * トークン上限に収まるようメモリを切り詰める
   *
   * 古い記憶から削除する（Requirement 4.3）
   *
   * @param header - ヘッダー文字列
   * @param formattedMemories - フォーマット済みメモリ配列
   * @param maxTokens - 最大トークン数
   * @returns 調整済みのコンテキスト文字列
   */
  private truncateToTokenLimit(
    header: string,
    formattedMemories: string[],
    maxTokens: number
  ): string {
    const headerTokens = this.estimateTokens(header)

    // ヘッダーだけでトークン上限を超える場合
    if (headerTokens >= maxTokens) {
      return ''
    }

    const availableTokens = maxTokens - headerTokens
    const selectedMemories: string[] = []
    let currentTokens = 0

    // 新しい順に追加（古いものから削除されるよう）
    // formattedMemoriesは古い順なので、逆順でチェック
    for (let i = formattedMemories.length - 1; i >= 0; i--) {
      const memory = formattedMemories[i]
      const memoryTokens = this.estimateTokens(memory + '\n')

      if (currentTokens + memoryTokens <= availableTokens) {
        selectedMemories.unshift(memory) // 先頭に追加して順序を維持
        currentTokens += memoryTokens
      }
    }

    if (selectedMemories.length === 0) {
      return ''
    }

    return header + selectedMemories.join('\n')
  }
}
