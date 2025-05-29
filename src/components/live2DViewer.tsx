'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import { live2dStorage } from '@/lib/indexedDB'
import settingsStore from '@/features/stores/settings'

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
  const [showErrorMessage, setShowErrorMessage] = useState(false)
  const [loadingMethod, setLoadingMethod] = useState<
    'checking' | 'indexeddb' | 'public' | 'failed'
  >('checking')
  const [blobURL, setBlobURL] = useState<string | null>(null)
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
      return true
    }
    return false
  }

  // IndexedDBからファイルを確認
  const checkIndexedDBFile = async () => {
    try {
      console.log('Checking IndexedDB for Cubism Core file...')
      const hasFile = await live2dStorage.hasCoreFile()

      if (hasFile) {
        console.log('Found Cubism Core file in IndexedDB')
        const coreFile = await live2dStorage.getCoreFile()
        if (coreFile) {
          const url = live2dStorage.createBlobURL(coreFile.fileContent)
          setBlobURL(url)
          setLoadingMethod('indexeddb')
          return true
        }
      }

      console.log(
        'No Cubism Core file found in IndexedDB, trying public folder...'
      )
      setLoadingMethod('public')
      return false
    } catch (error) {
      console.error('Error checking IndexedDB:', error)
      setLoadingMethod('public')
      return false
    }
  }

  // 動的スクリプト実行
  const loadScriptFromBlob = async (blobURL: string) => {
    try {
      console.log('Loading script from blob URL:', blobURL)

      // スクリプトタグを動的に作成
      const script = document.createElement('script')
      script.src = blobURL
      script.async = true

      // Promise でスクリプトの読み込み完了を待つ
      await new Promise<void>((resolve, reject) => {
        script.onload = () => {
          console.log('Cubism Core loaded from IndexedDB')
          setIsCubismCoreLoaded(true)
          resolve()
        }
        script.onerror = (error) => {
          console.error('Failed to load script from blob:', error)
          reject(error)
        }
        document.head.appendChild(script)
      })
    } catch (error) {
      console.error('Error loading script from blob:', error)
      // フォールバック: public フォルダからの読み込みを試行
      setLoadingMethod('public')
    }
  }

  useEffect(() => {
    console.log('Live2DViewer mounted')
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && loadingMethod === 'checking') {
      checkIndexedDBFile()
    }
  }, [isMounted, loadingMethod])

  useEffect(() => {
    if (loadingMethod === 'indexeddb' && blobURL) {
      loadScriptFromBlob(blobURL)
    }
  }, [loadingMethod, blobURL])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (blobURL) {
        URL.revokeObjectURL(blobURL)
      }
    }
  }, [blobURL])

  const handleOpenSettings = () => {
    setShowErrorMessage(false)
    // キャラクター設定画面を開いてLive2Dを選択状態にする
    settingsStore.setState({ modelType: 'live2d' })
    menuStore.setState({
      showSettingsScreen: true,
      activeSettingsTab: 'character',
    })
  }

  if (!isMounted) {
    console.log('Live2DViewer not mounted yet')
    return null
  }

  if (showErrorMessage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg max-w-md mx-4">
          <h3 className="text-lg font-bold text-red-600 mb-4">
            Live2D Cubism Core が見つかりません
          </h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>Live2D機能を使用するには、Cubism Coreファイルが必要です。</p>

            <div className="mt-4">
              <p className="font-semibold">対処方法：</p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                <li>設定画面からファイルをアップロード</li>
                <li>
                  または、<code>public/scripts/live2dcubismcore.min.js</code>{' '}
                  に配置
                </li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs font-medium text-blue-800">
                ファイルの取得方法：
              </p>
              <a
                href="https://www.live2d.com/sdk/download/web/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-xs"
              >
                Live2D公式サイト
              </a>
              <span className="text-xs">
                {' '}
                からSDKをダウンロードしてください
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleOpenSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              設定画面を開く
            </button>
            <button
              onClick={() => setShowErrorMessage(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )
  }

  console.log('Rendering Live2DViewer, loading method:', loadingMethod)
  return (
    <div className="fixed bottom-0 right-0 w-screen h-screen z-5">
      {/* IndexedDBからの読み込みが失敗した場合のフォールバック */}
      {loadingMethod === 'public' && (
        <Script
          key={`cubismcore-${scriptLoadRetries.cubismcore}`}
          src="/scripts/live2dcubismcore.min.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('cubismcore loaded from public folder')
            setIsCubismCoreLoaded(true)
          }}
          onError={() => {
            console.error('Failed to load cubism core from public folder')
            if (retryLoadScript('cubismcore')) {
              console.log('Retrying cubismcore load...')
            } else {
              console.error('Max retries reached for cubismcore')
              setLoadingMethod('failed')
              setShowErrorMessage(true)
            }
          }}
        />
      )}
      {isCubismCoreLoaded && <Live2DComponent />}
    </div>
  )
}
