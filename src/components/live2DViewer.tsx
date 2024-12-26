'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import homeStore from '@/features/stores/home'

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
      return null
    },
  }
)

export default function Live2DViewer() {
  const [isMounted, setIsMounted] = useState(false)
  const [scriptLoadRetries, setScriptLoadRetries] = useState({
    cubismcore: 0,
    live2d: 0,
  })
  const MAX_RETRIES = 3

  const isCubismCoreLoaded = homeStore((s) => s.isCubismCoreLoaded)
  const setIsCubismCoreLoaded = homeStore((s) => s.setIsCubismCoreLoaded)
  const isLive2dLoaded = homeStore((s) => s.isLive2dLoaded)
  const setIsLive2dLoaded = homeStore((s) => s.setIsLive2dLoaded)

  // スクリプトの再読み込み処理
  const retryLoadScript = (scriptName: 'cubismcore' | 'live2d') => {
    if (scriptLoadRetries[scriptName] < MAX_RETRIES) {
      setScriptLoadRetries((prev) => ({
        ...prev,
        [scriptName]: prev[scriptName] + 1,
      }))
      // 強制的に再読み込みするためにキーを変更
      return true
    }
    return false
  }

  useEffect(() => {
    console.log('Live2DViewer mounted')
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    console.log('Live2DViewer not mounted yet')
    return null
  }

  console.log('Rendering Live2DViewer')
  return (
    <div className="fixed bottom-0 right-0 w-screen h-screen">
      <Script
        key={`cubismcore-${scriptLoadRetries.cubismcore}`}
        src="/scripts/live2dcubismcore.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('cubismcore loaded')
          setIsCubismCoreLoaded(true)
        }}
        onError={() => {
          console.error('Failed to load cubism core')
          if (retryLoadScript('cubismcore')) {
            console.log('Retrying cubismcore load...')
          } else {
            console.error('Max retries reached for cubismcore')
          }
        }}
      />
      {isCubismCoreLoaded && (
        <Script
          key={`live2d-${scriptLoadRetries.live2d}`}
          src="/scripts/live2d.min.js"
          onLoad={() => {
            console.log('live2d loaded')
            setIsLive2dLoaded(true)
          }}
          onError={() => {
            console.error('Failed to load live2d')
            if (retryLoadScript('live2d')) {
              console.log('Retrying live2d load...')
            } else {
              console.error('Max retries reached for live2d')
            }
          }}
        />
      )}
      {isCubismCoreLoaded && isLive2dLoaded && <Live2DComponent />}
    </div>
  )
}
