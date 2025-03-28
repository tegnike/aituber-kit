import { Application, Ticker, DisplayObject } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch/cubism4'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { Live2DHandler } from '@/features/messages/live2dHandler'
import { debounce } from 'lodash'

console.log('Live2DComponent module loaded')

const setModelPosition = (
  app: Application,
  model: InstanceType<typeof Live2DModel>
) => {
  const scale = 0.3
  model.scale.set(scale)
  model.x = app.renderer.width / 2
  model.y = app.renderer.height / 2
}

const Live2DComponent = () => {
  console.log('Live2DComponent rendering')

  const canvasContainerRef = useRef<HTMLCanvasElement>(null)
  const [app, setApp] = useState<Application | null>(null)
  const [model, setModel] = useState<InstanceType<typeof Live2DModel> | null>(
    null
  )
  const modelRef = useRef<InstanceType<typeof Live2DModel> | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const selectedLive2DPath = settingsStore((state) => state.selectedLive2DPath)
  // ピンチジェスチャー用の状態
  const [pinchDistance, setPinchDistance] = useState<number | null>(null)
  const [initialScale, setInitialScale] = useState<number | null>(null)

  useEffect(() => {
    initApp()
    return () => {
      if (modelRef.current) {
        modelRef.current.destroy()
        modelRef.current = null
      }
      if (app) {
        app.destroy(true)
      }
    }
  }, [])

  useEffect(() => {
    if (app && selectedLive2DPath) {
      // 既存のモデルがある場合は先に削除
      if (modelRef.current) {
        app.stage.removeChild(modelRef.current as unknown as DisplayObject)
        modelRef.current.destroy()
        modelRef.current = null
        setModel(null)
      }
      // ステージをクリア
      app.stage.removeChildren()
      // 新しいモデルを読み込む
      loadLive2DModel(app, selectedLive2DPath)
    }
  }, [app, selectedLive2DPath])

  const initApp = () => {
    if (!canvasContainerRef.current) return

    const app = new Application({
      width: window.innerWidth,
      height: window.innerHeight,
      view: canvasContainerRef.current,
      backgroundAlpha: 0,
      antialias: true,
    })

    setApp(app)
  }

  const loadLive2DModel = async (
    currentApp: Application,
    modelPath: string
  ) => {
    if (!canvasContainerRef.current) return
    const hs = homeStore.getState()

    try {
      const newModel = await Live2DModel.fromSync(modelPath, {
        ticker: Ticker.shared,
        autoHitTest: false,
        autoFocus: false,
      })

      await new Promise((resolve, reject) => {
        newModel.once('load', () => resolve(true))
        newModel.once('error', (e) => reject(e))
        setTimeout(() => reject(new Error('Model load timeout')), 10000)
      })

      currentApp.stage.addChild(newModel as unknown as DisplayObject)
      newModel.anchor.set(0.5, 0.5)
      setModelPosition(currentApp, newModel)

      modelRef.current = newModel
      setModel(newModel)
      hs.live2dViewer = newModel

      await Live2DHandler.resetToIdle()
    } catch (error) {
      console.error('Failed to load Live2D model:', error)
    }
  }

  // 2点間の距離を計算する関数
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  useEffect(() => {
    if (!canvasContainerRef.current || !model) return

    const canvas = canvasContainerRef.current

    const handlePointerDown = (event: PointerEvent) => {
      setIsDragging(true)
      setDragOffset({
        x: event.clientX - model.x,
        y: event.clientY - model.y,
      })

      if (event.button !== 2) {
        model.tap(event.clientX, event.clientY)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isDragging) {
        model.x = event.clientX - dragOffset.x
        model.y = event.clientY - dragOffset.y
      }
    }

    const handlePointerUp = () => {
      setIsDragging(false)
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      // スケール変更を緩やかにするため、係数を小さくする
      const scaleChange = event.deltaY * -0.0002
      // 現在のスケールに緩やかな変更を適用
      const newScale = model.scale.x + scaleChange
      // スケールの範囲は0.1から2.0に制限
      if (newScale >= 0.1 && newScale <= 2.0) {
        model.scale.set(newScale)
      }
    }

    // タッチイベント処理
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        // ピンチ開始
        const dist = getDistance(event.touches[0], event.touches[1])
        setPinchDistance(dist)
        setInitialScale(model.scale.x)
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (
        event.touches.length === 2 &&
        pinchDistance !== null &&
        initialScale !== null
      ) {
        // ピンチ中
        const currentDistance = getDistance(event.touches[0], event.touches[1])
        const scale = initialScale * (currentDistance / pinchDistance)

        // スケールの範囲制限
        const newScale = Math.min(Math.max(scale, 0.1), 2.0)
        model.scale.set(newScale)
      }
    }

    const handleTouchEnd = () => {
      // ピンチ終了
      setPinchDistance(null)
      setInitialScale(null)
    }

    // イベントリスナーの登録
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    // タッチイベントリスナーの登録
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchmove', handleTouchMove)
    canvas.addEventListener('touchend', handleTouchEnd)

    // クリーンアップ関数
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('wheel', handleWheel)

      // タッチイベントリスナーの削除
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [model, isDragging, dragOffset, pinchDistance, initialScale])

  useEffect(() => {
    if (!app || !model) return

    const onResize = debounce(() => {
      if (!canvasContainerRef.current) return

      app.renderer.resize(
        canvasContainerRef.current.clientWidth,
        canvasContainerRef.current.clientHeight
      )

      setModelPosition(app, model)
    }, 250)

    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      onResize.cancel() // クリーンアップ時にデバウンスをキャンセル
    }
  }, [app, model])

  return (
    <div className="w-screen h-screen">
      <canvas
        ref={canvasContainerRef}
        className="w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  )
}

export default Live2DComponent
