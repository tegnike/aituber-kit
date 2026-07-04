'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import ModelLoadingOverlay from '@/components/modelLoadingOverlay'

const PNGTuberComponent = dynamic(() => import('./PNGTuberComponent'), {
  ssr: false,
  loading: () => <ModelLoadingOverlay />,
})

export default function PNGTuberViewer() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <ModelLoadingOverlay />
  }

  return (
    <div className="fixed inset-0 w-screen h-screen z-10">
      <PNGTuberComponent />
    </div>
  )
}
