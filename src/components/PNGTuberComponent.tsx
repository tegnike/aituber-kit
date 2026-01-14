import { useEffect, useRef, useState, useCallback } from 'react'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { PNGTuberEngine } from '@/features/pngTuber/pngTuberEngine'

const PNGTuberComponent = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<PNGTuberEngine | null>(null)

  const selectedPNGTuberPath = settingsStore((s) => s.selectedPNGTuberPath)
  const pngTuberSensitivity = settingsStore((s) => s.pngTuberSensitivity)

  const [loadedPath, setLoadedPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ローディング状態は比較で判断
  const isLoading =
    selectedPNGTuberPath && loadedPath !== selectedPNGTuberPath && !error

  // エンジンを初期化
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return

    const engine = new PNGTuberEngine(videoRef.current, canvasRef.current)
    engineRef.current = engine

    // homeStoreに登録
    homeStore.setState({ pngTuberViewer: engine })

    return () => {
      engine.destroy()
      engineRef.current = null
      homeStore.setState({ pngTuberViewer: null })
    }
  }, [])

  // アセットを読み込む
  useEffect(() => {
    const engine = engineRef.current
    if (!engine || !selectedPNGTuberPath) return

    // 既に同じパスがロード済みの場合はスキップ
    if (loadedPath === selectedPNGTuberPath) return

    let cancelled = false

    engine
      .loadAsset(selectedPNGTuberPath)
      .then(() => {
        if (cancelled) return
        setLoadedPath(selectedPNGTuberPath)
        setError(null)
        engine.start()
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load PNGTuber asset:', err)
        setError('PNGTuberアセットの読み込みに失敗しました')
      })

    return () => {
      cancelled = true
    }
  }, [selectedPNGTuberPath, loadedPath])

  // 感度を更新
  useEffect(() => {
    engineRef.current?.setSensitivity(pngTuberSensitivity)
  }, [pngTuberSensitivity])

  // ドラッグ&ドロップで背景画像を設定
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (!files?.[0]?.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.readAsDataURL(files[0])
    reader.onload = () => {
      const image = reader.result as string
      if (image) {
        homeStore.setState({ modalImage: image })
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 背景動画 */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain"
        playsInline
        muted
        loop
      />
      {/* 口のオーバーレイキャンバス */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
      {/* エラー表示 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center p-4">
            <p className="text-lg">{error}</p>
            <p className="text-sm mt-2">
              public/pngtuber/ にアセットを配置してください
            </p>
          </div>
        </div>
      )}
      {/* 読み込み中表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white">読み込み中...</div>
        </div>
      )}
    </div>
  )
}

export default PNGTuberComponent
