import { Application, Ticker, DisplayObject } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { Live2DHandler } from '@/features/messages/live2dHandler'

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
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    initApp()
  }, [])

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
    initLive2D(app)
  }

  const initLive2D = async (currentApp: Application) => {
    if (!canvasContainerRef.current) return
    const hs = homeStore.getState()
    const ss = settingsStore.getState()
    try {
      const model = await Live2DModel.from(
        '/live2d/nike01/nike01.model3.json',
        { ticker: Ticker.shared, autoInteract: false }
      )

      currentApp.stage.addChild(model as unknown as DisplayObject)

      model.anchor.set(0.5, 0.5)
      setModelPosition(currentApp, model)

      model.on('hit', (hitAreas: any) => {
        if (hitAreas.includes('Body')) {
          model.motion('Tap@Body')
        }
      })

      hs.live2dViewer = model
      setModel(model)

      await Live2DHandler.resetToIdle()
    } catch (error) {
      console.error('Failed to load Live2D model:', error)
    }
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
      // model.focus(event.clientX, event.clientY)
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

    // イベントリスナーの登録
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })

    // クリーンアップ関数
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [model, isDragging, dragOffset])

  useEffect(() => {
    if (!app || !model) return

    const onResize = () => {
      if (!canvasContainerRef.current) return

      app.renderer.resize(
        canvasContainerRef.current.clientWidth,
        canvasContainerRef.current.clientHeight
      )

      setModelPosition(app, model)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [app, model])

  return (
    <div className="border-2 border-red-500">
      <canvas
        ref={canvasContainerRef}
        className="w-full h-full"
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  )
}

export default Live2DComponent
