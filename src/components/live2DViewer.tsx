'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Trans, useTranslation } from 'react-i18next'
import Script from 'next/script'
import homeStore from '@/features/stores/home'
import { live2dStorage } from '@/lib/indexedDB'
import { IconButton } from './iconButton'
import { Link } from './link'

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

type LoadingMethod = 'checking' | 'indexeddb' | 'public' | 'failed'

export default function Live2DViewer() {
  const { t } = useTranslation()

  const [isMounted, setIsMounted] = useState(false)
  const [scriptLoadRetries, setScriptLoadRetries] = useState({
    cubismcore: 0,
    live2d: 0,
  })
  const [showErrorMessage, setShowErrorMessage] = useState(false)
  const [loadingMethod, setLoadingMethod] = useState<LoadingMethod>('checking')
  const [blobURL, setBlobURL] = useState<string | null>(null)
  const [loadedScript, setLoadedScript] = useState<HTMLScriptElement | null>(
    null
  )
  const MAX_RETRIES = 3

  // useRefで最新値を追跡
  const blobURLRef = useRef<string | null>(null)
  const loadedScriptRef = useRef<HTMLScriptElement | null>(null)

  // 値が変更された時にrefも更新
  useEffect(() => {
    blobURLRef.current = blobURL
  }, [blobURL])

  useEffect(() => {
    loadedScriptRef.current = loadedScript
  }, [loadedScript])

  const isCubismCoreLoaded = homeStore((s) => s.isCubismCoreLoaded)
  const setIsCubismCoreLoaded = homeStore((s) => s.setIsCubismCoreLoaded)
  const isLive2dLoaded = homeStore((s) => s.isLive2dLoaded)
  const setIsLive2dLoaded = homeStore((s) => s.setIsLive2dLoaded)
  const live2dVisible = homeStore((s) => s.live2dVisible)
  const setLive2dVisible = homeStore((s) => s.setLive2dVisible)

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

  // publicフォルダのファイル存在確認
  const checkPublicFile = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/scripts/live2dcubismcore.min.js', {
        method: 'HEAD',
      })
      const exists = response.ok
      return exists
    } catch (error) {
      console.error('Error checking public file:', error)
      return false
    }
  }, [])

  // IndexedDBからファイルを確認
  const checkIndexedDBFile = useCallback(async (): Promise<boolean> => {
    try {
      const hasFile = await live2dStorage.hasCoreFile()

      if (hasFile) {
        const coreFile = await live2dStorage.getCoreFile()
        if (coreFile) {
          const url = live2dStorage.createBlobURL(coreFile.fileContent)
          setBlobURL(url)
          setLoadingMethod('indexeddb')
          setLive2dVisible(true)
          return true
        }
      }

      // IndexedDBにファイルがない場合、publicフォルダをチェック
      const publicFileExists = await checkPublicFile()
      if (publicFileExists) {
        setLoadingMethod('public')
        setLive2dVisible(true)
        return false
      } else {
        // どちらにもファイルがない場合、即座にエラー表示
        setLoadingMethod('failed')
        setLive2dVisible(false)
        setShowErrorMessage(true)
        return false
      }
    } catch (error) {
      console.error('Error checking IndexedDB:', error)
      // エラーが発生した場合、publicフォルダをチェック
      const publicFileExists = await checkPublicFile()
      if (publicFileExists) {
        setLoadingMethod('public')
        setLive2dVisible(true)
        return false
      } else {
        setLoadingMethod('failed')
        setLive2dVisible(false)
        setShowErrorMessage(true)
        return false
      }
    }
  }, [checkPublicFile, setLive2dVisible])

  // 動的スクリプト実行
  const loadScriptFromBlob = useCallback(
    async (blobURL: string): Promise<void> => {
      if (!blobURL) return

      try {
        // 既存のスクリプトがあれば削除
        if (loadedScript && loadedScript.parentNode) {
          loadedScript.parentNode.removeChild(loadedScript)
          setLoadedScript(null)
        }

        // スクリプトタグを動的に作成
        const script = document.createElement('script')
        script.src = blobURL
        script.async = true

        // Promise でスクリプトの読み込み完了を待つ
        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            script.removeEventListener('load', onLoad)
            script.removeEventListener('error', onError)
          }

          const onLoad = () => {
            cleanup()
            setIsCubismCoreLoaded(true)
            setLoadedScript(script)
            resolve()
          }

          const onError = (error: Event | string) => {
            cleanup()
            console.error('Failed to load script from blob:', error)
            // スクリプト要素を削除
            if (script.parentNode) {
              script.parentNode.removeChild(script)
            }
            reject(new Error('Script load failed'))
          }

          script.addEventListener('load', onLoad)
          script.addEventListener('error', onError)
          document.head.appendChild(script)
        })
      } catch (error) {
        console.error('Error loading script from blob:', error)
        // フォールバック: public フォルダからの読み込みを試行
        setLoadingMethod('public')
      }
    },
    [setIsCubismCoreLoaded, loadedScript]
  )

  useEffect(() => {
    console.log('Live2DViewer mounted')
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && loadingMethod === 'checking') {
      checkIndexedDBFile()
    }
  }, [isMounted, loadingMethod, checkIndexedDBFile])

  useEffect(() => {
    if (loadingMethod === 'indexeddb' && blobURL && !isCubismCoreLoaded) {
      loadScriptFromBlob(blobURL)
    }
  }, [loadingMethod, blobURL, isCubismCoreLoaded, loadScriptFromBlob])

  // クリーンアップ - リソースとスクリプトの削除
  useEffect(() => {
    return () => {
      if (blobURLRef.current) {
        live2dStorage.revokeBlobURL(blobURLRef.current)
      }
      if (loadedScriptRef.current && loadedScriptRef.current.parentNode) {
        loadedScriptRef.current.parentNode.removeChild(loadedScriptRef.current)
      }
    }
  }, [])

  if (!isMounted) {
    console.log('Live2DViewer not mounted yet')
    return null
  }

  if (showErrorMessage) {
    return (
      <div className="absolute z-40 w-full h-full px-6 py-10 bg-black/30 font-M_PLUS_2 flex items-center justify-center">
        <div className="relative max-w-3xl max-h-full p-6 overflow-y-auto bg-white rounded-2xl">
          <div className="sticky top-0 right-0 z-10 flex justify-end">
            <IconButton
              iconName="24/Close"
              isProcessing={false}
              onClick={() => setShowErrorMessage(false)}
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white"
            />
          </div>
          <div className="mb-6">
            <div className="mb-2 font-bold text-xl text-secondary">
              {t('Live2D.CubismCoreNotFound')}
            </div>
            <Trans
              i18nKey="Live2D.CubismCoreDescription"
              components={{
                code: (
                  <code className="bg-gray-100 px-1 rounded mt-1 inline-block" />
                ),
              }}
            />
          </div>

          <div className="my-6">
            <div className="my-2 font-bold text-xl text-secondary">
              {t('Live2D.Solutions')}
            </div>
            <ol className="list-decimal list-inside mt-2 space-y-2">
              <li>{t('Live2D.SolutionUpload')}</li>
              <li>
                <Trans
                  i18nKey="Live2D.SolutionManualText"
                  components={{
                    code: (
                      <code className="bg-gray-100 px-1 rounded mt-1 inline-block" />
                    ),
                  }}
                />
              </li>
            </ol>
          </div>

          <div className="my-6">
            <div className="my-2 font-bold text-xl text-secondary">
              {t('Live2D.FileSource')}
            </div>
            <Trans
              i18nKey="Live2D.FileSourceDescription"
              components={{
                downloadLink: (
                  <Link
                    url="https://www.live2d.com/sdk/download/web/"
                    label={t('Live2D.OfficialSiteLink')}
                  />
                ),
              }}
            />
          </div>

          <div className="my-6">
            <button
              onClick={() => setShowErrorMessage(false)}
              className="font-bold bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled text-white px-6 py-2 rounded-full"
            >
              {t('Close')}
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
              setLive2dVisible(false)
              setShowErrorMessage(true)
            }
          }}
        />
      )}
      {live2dVisible && isCubismCoreLoaded && <Live2DComponent />}
    </div>
  )
}
