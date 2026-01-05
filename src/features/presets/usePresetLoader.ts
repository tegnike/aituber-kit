/**
 * usePresetLoader カスタムフック
 *
 * アプリ初期化時にtxtファイルからプリセットを読み込み、
 * settingsStoreを更新する
 *
 * Requirements:
 * - 3.1: characterPreset1-5の値を更新
 * - 3.3: アプリ初期化時に一度だけ読み込み
 */

import { useState, useEffect, useRef } from 'react'
import settingsStore from '@/features/stores/settings'
import {
  loadAllPresets,
  getPresetWithFallback,
  PresetLoaderResult,
} from './presetLoader'

/**
 * プリセットファイルを読み込むカスタムフック
 *
 * @returns 読み込み状態（loaded, error）
 */
export function usePresetLoader(): PresetLoaderResult {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    // 初期化は一度のみ実行 (Req 3.3)
    if (loadedRef.current) {
      return
    }
    loadedRef.current = true

    const loadPresets = async () => {
      try {
        const results = await loadAllPresets()
        const state = settingsStore.getState()

        // 各プリセットを更新 (Req 3.1)
        const updates: Partial<{
          characterPreset1: string
          characterPreset2: string
          characterPreset3: string
          characterPreset4: string
          characterPreset5: string
        }> = {}

        results.forEach((result) => {
          const key = `characterPreset${result.index}` as keyof typeof updates
          // txtファイルの内容があれば優先、なければ現在の値（環境変数/デフォルト）を維持
          if (result.content !== null) {
            updates[key] = result.content
          }
        })

        // storeを更新
        if (Object.keys(updates).length > 0) {
          settingsStore.setState(updates)
        }

        setLoaded(true)
      } catch (err) {
        // エラーが発生しても読み込み完了とする（フォールバック動作）
        console.warn('プリセット読み込み中にエラーが発生しました:', err)
        setLoaded(true)
        // 個別のファイル読み込みエラーは既にloadPresetFileで処理されているため、
        // ここでのエラーはnullのままにしておく
      }
    }

    loadPresets()
  }, [])

  return { loaded, error }
}
