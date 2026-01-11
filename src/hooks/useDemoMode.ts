import { useMemo } from 'react'

/**
 * デモモード状態を提供するカスタムフック
 * クライアントサイドでデモモードの有効/無効を判定
 */
export function useDemoMode(): {
  isDemoMode: boolean
} {
  return useMemo(() => {
    return { isDemoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' }
  }, [])
}
