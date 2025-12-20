/**
 * プリセットローダーモジュール
 *
 * /public/presets/ からtxtファイルを読み込み、プリセット値を管理する
 *
 * Requirements:
 * - 1.1-1.4: プリセットtxtファイルの読み込み
 * - 2.1-2.4: デフォルト値とのフォールバック
 * - 5.1-5.3: API経由での読み込み
 */

import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants'

/**
 * プリセットの内容を表す型
 */
export interface PresetContent {
  index: number
  content: string | null
}

/**
 * プリセットローダーの結果を表す型
 */
export interface PresetLoaderResult {
  loaded: boolean
  error: Error | null
}

/**
 * 単一のプリセットファイルを読み込む
 *
 * @param index プリセット番号 (1-5)
 * @returns ファイル内容、存在しない場合はnull
 *
 * Requirements: 1.3, 1.4, 5.1, 5.2
 */
export async function loadPresetFile(index: number): Promise<PresetContent> {
  const path = `/presets/preset${index}.txt`

  try {
    const response = await fetch(path)

    if (!response.ok) {
      // 404などのHTTPエラー時はnullを返す (Req 5.2)
      return { index, content: null }
    }

    const text = await response.text()

    // 空ファイルまたは空白のみの場合はnullを返す (Req 2.3)
    if (!text || text.trim() === '') {
      return { index, content: null }
    }

    // 改行やスペースを含む全てのテキストを保持 (Req 1.3)
    return { index, content: text }
  } catch (error) {
    // ネットワークエラー時はコンソールに警告を出力 (Req 2.2)
    console.warn(
      `プリセットファイル preset${index}.txt の読み込みに失敗しました:`,
      error
    )
    return { index, content: null }
  }
}

/**
 * 全プリセットを並列で読み込む
 *
 * @returns 全5つのプリセット内容
 *
 * Requirements: 1.1, 1.2, 2.3, 5.3
 */
export async function loadAllPresets(): Promise<PresetContent[]> {
  // Promise.allSettledを使用して5つのファイルを並列で非同期読み込み (Req 5.3)
  const promises = [1, 2, 3, 4, 5].map((index) => loadPresetFile(index))
  const results = await Promise.all(promises)

  return results
}

/**
 * プリセット内容とフォールバック値から最終的なプリセット値を決定する
 *
 * 優先順位: txtファイル > 環境変数 > SYSTEM_PROMPT (Req 2.4)
 *
 * @param content txtファイルから読み込んだ内容
 * @param envValue 環境変数の値
 * @returns 最終的なプリセット値
 *
 * Requirements: 2.1, 2.2, 2.4
 */
export function getPresetWithFallback(
  content: string | null,
  envValue: string | undefined
): string {
  // txtファイルがあれば優先 (Req 2.4)
  if (content !== null && content.trim() !== '') {
    return content
  }

  // 次に環境変数をチェック
  if (envValue !== undefined && envValue.trim() !== '') {
    return envValue
  }

  // 最後にデフォルト値を使用 (Req 2.1)
  return SYSTEM_PROMPT
}
