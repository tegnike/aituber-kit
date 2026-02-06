import { useMemo } from 'react'
import { isRestrictedMode } from '@/utils/restrictedMode'

/**
 * 制限モード状態を提供するカスタムフック
 * クライアントサイドで制限モードの有効/無効を判定
 */
export function useRestrictedMode(): {
  isRestrictedMode: boolean
} {
  return useMemo(() => {
    return { isRestrictedMode: isRestrictedMode() }
  }, [])
}
