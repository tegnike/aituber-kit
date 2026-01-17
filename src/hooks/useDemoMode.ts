import { useMemo } from 'react'
import { isDemoMode } from '@/utils/demoMode'

/**
 * デモモード状態を提供するカスタムフック
 * クライアントサイドでデモモードの有効/無効を判定
 */
export function useDemoMode(): {
  isDemoMode: boolean
} {
  return useMemo(() => {
    return { isDemoMode: isDemoMode() }
  }, [])
}
