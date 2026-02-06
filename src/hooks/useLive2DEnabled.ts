import { useMemo } from 'react'
import { isLive2DEnabled as checkLive2DEnabled } from '@/utils/live2dRestriction'

/**
 * Live2D有効状態を提供するカスタムフック
 * クライアントサイドでLive2D機能の有効/無効を判定
 */
export function useLive2DEnabled(): {
  isLive2DEnabled: boolean
} {
  return useMemo(() => {
    return { isLive2DEnabled: checkLive2DEnabled() }
  }, [])
}
