import { useEffect, useLayoutEffect } from 'react'

/**
 * SSR対応のuseLayoutEffect
 * サーバーサイドではuseEffectを、クライアントサイドではuseLayoutEffectを使用
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
