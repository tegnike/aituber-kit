import { Application, Ticker, DisplayObject } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch/cubism4'
import homeStore from '@/features/stores/home'

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

    try {
      const model = await Live2DModel.from(
        '/live2d/nike02/nike01.model3.json',
        // '/live2d/hiyori_free_jp/runtime/hiyori_free_t08.model3.json',
        { ticker: Ticker.shared, autoInteract: false } // autoInteractで視線追従させない
      )

      currentApp.stage.addChild(model as unknown as DisplayObject)

      model.anchor.set(0.5, 0.5)
      setModelPosition(currentApp, model)

      model.on('hit', (hitAreas) => {
        if (hitAreas.includes('Body')) {
          model.motion('Tap@Body')
        }
      })

      setModel(model)
      hs.live2dViewer = model
      setModel(model)
    } catch (error) {
      console.error('Failed to load Live2D model:', error)
    }
  }

  useEffect(() => {
    if (!canvasContainerRef.current || !model) return

    const canvas = canvasContainerRef.current

    const handlePointerDown = (event: PointerEvent) => {
      model.tap(event.clientX, event.clientY)
      setIsDragging(true)
      setDragOffset({
        x: event.clientX - model.x,
        y: event.clientY - model.y,
      })
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
      const scaleChange = event.deltaY * -0.001
      const newScale = model.scale.x + scaleChange
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
      <canvas ref={canvasContainerRef} className="w-full h-full" />
    </div>
  )
}

export default Live2DComponent
