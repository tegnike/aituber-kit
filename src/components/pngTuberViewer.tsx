'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const PNGTuberComponent = dynamic(() => import('./PNGTuberComponent'), {
  ssr: false,
  loading: () => null,
})

export default function PNGTuberViewer() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="fixed inset-0 w-screen h-screen z-10">
      <PNGTuberComponent />
    </div>
  )
}
