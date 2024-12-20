'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Script from 'next/script'

const Live2DComponent = dynamic(
  () => {
    console.log('Loading Live2DComponent...')
    return import('./Live2DComponent')
      .then((mod) => {
        console.log('Live2DComponent loaded successfully')
        return mod
      })
      .catch((err) => {
        console.error('Failed to load Live2DComponent:', err)
        throw err
      })
  },
  {
    ssr: false,
    loading: () => {
      console.log('Live2DComponent is loading...')
      return (
        <div className="border-2 border-yellow-500 w-full h-full">
          Loading...
        </div>
      )
    },
  }
)

export default function Live2DViewer() {
  const [isMounted, setIsMounted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)

  useEffect(() => {
    console.log('Live2DViewer mounted')
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    console.log('Live2DViewer not mounted yet')
    return null
  }

  if (hasError) {
    return (
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] border-2 border-red-500">
        Failed to load Live2D component
      </div>
    )
  }

  console.log('Rendering Live2DViewer')
  return (
    <div className="fixed">
      <Script
        src="/scripts/live2dcubismcore.min.js"
        onLoad={() => {
          console.log('cubismcore loaded')
          setScriptsLoaded(true)
        }}
      />
      {scriptsLoaded && <Live2DComponent />}
    </div>
  )
}
