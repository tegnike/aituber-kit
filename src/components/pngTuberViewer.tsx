'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import settingsStore from '@/features/stores/settings'
import { useIsMobileLayout } from '@/hooks/useIsMobileLayout'

const PNGTuberComponent = dynamic(() => import('./PNGTuberComponent'), {
  ssr: false,
  loading: () => null,
})

export default function PNGTuberViewer() {
  const [isMounted, setIsMounted] = useState(false)
  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const isMobileLayout = useIsMobileLayout()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div
      className="fixed inset-y-0 right-0 h-screen z-10"
      data-no-window-drag="true"
      style={{
        left: isMobileLayout ? '0px' : `${chatLogWidth}px`,
        width: isMobileLayout ? '100vw' : `calc(100vw - ${chatLogWidth}px)`,
      }}
    >
      <PNGTuberComponent />
    </div>
  )
}
