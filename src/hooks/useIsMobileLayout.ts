import { useEffect, useState } from 'react'
import layoutStore from '@/features/stores/layout'

export const useIsMobileLayout = () => {
  const layoutMode = layoutStore((s) => s.layoutMode)
  const [isCompactLayout, setIsCompactLayout] = useState(false)
  const [isDedicatedMobileWindow, setIsDedicatedMobileWindow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsDedicatedMobileWindow(
      new URLSearchParams(window.location.search).get('layout') ===
        'mobile-window'
    )

    const mql = window.matchMedia('(max-width: 768px)')
    setIsCompactLayout(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsCompactLayout(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return (
    isDedicatedMobileWindow ||
    layoutMode === 'mobile' ||
    (layoutMode === 'auto' && isCompactLayout)
  )
}
