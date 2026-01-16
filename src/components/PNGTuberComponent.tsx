import { useEffect, useRef, useState, useCallback } from 'react'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { PNGTuberEngine } from '@/features/pngTuber/pngTuberEngine'

const PNGTuberComponent = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const transformContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const mouthCanvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<PNGTuberEngine | null>(null)

  const selectedPNGTuberPath = settingsStore((s) => s.selectedPNGTuberPath)
  const pngTuberSensitivity = settingsStore((s) => s.pngTuberSensitivity)
  const pngTuberChromaKeyEnabled = settingsStore(
    (s) => s.pngTuberChromaKeyEnabled
  )
  const pngTuberChromaKeyColor = settingsStore((s) => s.pngTuberChromaKeyColor)
  const pngTuberChromaKeyTolerance = settingsStore(
    (s) => s.pngTuberChromaKeyTolerance
  )

  // ズーム・ドラッグ用の設定を購読
  const pngTuberScale = settingsStore((s) => s.pngTuberScale)
  const pngTuberOffsetX = settingsStore((s) => s.pngTuberOffsetX)
  const pngTuberOffsetY = settingsStore((s) => s.pngTuberOffsetY)

  // ドラッグ状態の追跡（refで管理してリスナーを安定させる）
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  // ドラッグ中の一時的な位置を追跡（即座にUIに反映するため）
  const [tempOffset, setTempOffset] = useState({ x: 0, y: 0 })
  const tempOffsetRef = useRef({ x: 0, y: 0 })

  const [loadedPath, setLoadedPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ローディング状態は比較で判断
  const isLoading =
    selectedPNGTuberPath && loadedPath !== selectedPNGTuberPath && !error

  // エンジンを初期化
  useEffect(() => {
    if (!videoRef.current || !mainCanvasRef.current || !mouthCanvasRef.current)
      return

    const engine = new PNGTuberEngine(
      videoRef.current,
      mainCanvasRef.current,
      mouthCanvasRef.current
    )
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

    // 新しいアセットを読み込む前に既存のレンダーループを停止
    engine.stop()
    setError(null)

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

  // クロマキー設定を更新
  useEffect(() => {
    engineRef.current?.setChromaKeySettings(
      pngTuberChromaKeyEnabled,
      pngTuberChromaKeyColor,
      pngTuberChromaKeyTolerance
    )
  }, [
    pngTuberChromaKeyEnabled,
    pngTuberChromaKeyColor,
    pngTuberChromaKeyTolerance,
  ])

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
    reader.onerror = () => {
      console.error('Failed to read image file')
    }
  }, [])

  // ホイールイベント（ズーム）
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const currentScale = settingsStore.getState().pngTuberScale
    const scaleChange = e.deltaY * -0.001
    const newScale = Math.max(0.1, Math.min(3.0, currentScale + scaleChange))
    settingsStore.setState({ pngTuberScale: newScale })
  }, [])

  // ポインターイベント（ドラッグ）- refを使用してハンドラーを安定させる
  const handlePointerDown = useCallback((e: PointerEvent) => {
    const currentOffsetX = settingsStore.getState().pngTuberOffsetX
    const currentOffsetY = settingsStore.getState().pngTuberOffsetY

    isDraggingRef.current = true
    setIsDragging(true)

    const offset = { x: currentOffsetX, y: currentOffsetY }
    tempOffsetRef.current = offset
    setTempOffset(offset)

    dragStartRef.current = {
      x: e.clientX - currentOffsetX,
      y: e.clientY - currentOffsetY,
    }
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return

    const newOffset = {
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    }
    tempOffsetRef.current = newOffset
    setTempOffset(newOffset)
  }, [])

  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current) {
      // ドラッグ終了時に位置を保存
      settingsStore.setState({
        pngTuberOffsetX: tempOffsetRef.current.x,
        pngTuberOffsetY: tempOffsetRef.current.y,
      })
      isDraggingRef.current = false
      setIsDragging(false)
    }
  }, [])

  // イベントリスナーを登録
  useEffect(() => {
    const container = transformContainerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [handleWheel, handlePointerDown, handlePointerMove, handlePointerUp])

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* トランスフォームコンテナ（ズーム・ドラッグ用） */}
      <div
        ref={transformContainerRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${isDragging ? tempOffset.x : pngTuberOffsetX}px, ${isDragging ? tempOffset.y : pngTuberOffsetY}px) scale(${pngTuberScale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* 背景動画（クロマキー無効時のみ表示） */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-contain ${
            pngTuberChromaKeyEnabled ? 'invisible' : ''
          }`}
          playsInline
          muted
          loop
        />
        {/* メインキャンバス（クロマキー有効時: 動画+口を描画、無効時: 非表示） */}
        <canvas
          ref={mainCanvasRef}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
            pngTuberChromaKeyEnabled ? '' : 'invisible'
          }`}
        />
        {/* 口のオーバーレイキャンバス（クロマキー無効時のみ使用） */}
        <canvas
          ref={mouthCanvasRef}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
            pngTuberChromaKeyEnabled ? 'invisible' : ''
          }`}
        />
      </div>
      {/* エラー表示 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-white">読み込み中...</div>
        </div>
      )}
    </div>
  )
}

export default PNGTuberComponent
