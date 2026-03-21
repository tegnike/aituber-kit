'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { useIsMobileLayout } from '@/hooks/useIsMobileLayout'

const Live2DComponent = dynamic(
  () => {
    console.log('Loading Live2DComponent...')
    return import('./Live2DComponent')
      .then((mod) => mod.default)
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
  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const isMobileLayout = useIsMobileLayout()

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
    <div
      className="fixed inset-y-0 right-0 z-5"
      data-no-window-drag="true"
      style={{
        left: isMobileLayout ? '0px' : `${chatLogWidth}px`,
        width: isMobileLayout ? '100vw' : `calc(100vw - ${chatLogWidth}px)`,
      }}
    >
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
      {isCubismCoreLoaded && <Live2DComponent />}
    </div>
  )
}
