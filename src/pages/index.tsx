import { useCallback, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useTranslation } from 'react-i18next'
import { Form } from '@/components/form'
import { Meta } from '@/components/meta'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import '@/lib/i18n'
import { buildUrl } from '@/utils/buildUrl'
import toastStore from '@/features/stores/toast'
import { usePresetLoader } from '@/features/presets/usePresetLoader'
import { useLive2DEnabled } from '@/hooks/useLive2DEnabled'
import { useIsMobileLayout } from '@/hooks/useIsMobileLayout'
import { useIsDedicatedMobileWindow } from '@/hooks/useIsDedicatedMobileWindow'

const Introduction = dynamic(
  () => import('@/components/introduction').then((mod) => mod.Introduction),
  { ssr: false, loading: () => null }
)
const Menu = dynamic(() => import('@/components/menu').then((mod) => mod.Menu), {
  ssr: false,
  loading: () => null,
})
const ModalImage = dynamic(() => import('@/components/modalImage'), {
  ssr: false,
  loading: () => null,
})
const VrmViewer = dynamic(() => import('@/components/vrmViewer'), {
  ssr: false,
  loading: () => null,
})
const Live2DViewer = dynamic(() => import('@/components/live2DViewer'), {
  ssr: false,
  loading: () => null,
})
const PNGTuberViewer = dynamic(() => import('@/components/pngTuberViewer'), {
  ssr: false,
  loading: () => null,
})
const Toasts = dynamic(() => import('@/components/toasts').then((mod) => mod.Toasts), {
  ssr: false,
  loading: () => null,
})
const MessageReceiver = dynamic(() => import('@/components/messageReceiver'), {
  ssr: false,
  loading: () => null,
})
const WebSocketManager = dynamic(
  () => import('@/components/websocketManager').then((mod) => mod.WebSocketManager),
  {
    ssr: false,
    loading: () => null,
  }
)
const YoutubeManager = dynamic(
  () => import('@/components/youtubeManager').then((mod) => mod.YoutubeManager),
  {
    ssr: false,
    loading: () => null,
  }
)
const MemoryServiceInitializer = dynamic(
  () =>
    import('@/components/memoryServiceInitializer').then(
      (mod) => mod.MemoryServiceInitializer
    ),
  {
    ssr: false,
    loading: () => null,
  }
)
const CharacterPresetMenu = dynamic(
  () => import('@/components/characterPresetMenu'),
  {
    ssr: false,
    loading: () => null,
  }
)
const ImageOverlay = dynamic(() => import('@/components/ImageOverlay'), {
  ssr: false,
  loading: () => null,
})
const PresenceManager = dynamic(() => import('@/components/presenceManager'), {
  ssr: false,
  loading: () => null,
})
const IdleManager = dynamic(() => import('@/components/idleManager'), {
  ssr: false,
  loading: () => null,
})
const KioskOverlay = dynamic(
  () => import('@/features/kiosk/kioskOverlay').then((mod) => mod.KioskOverlay),
  {
    ssr: false,
    loading: () => null,
  }
)

const Home = () => {
  const webcamStatus = homeStore((s) => s.webcamStatus)
  const captureStatus = homeStore((s) => s.captureStatus)
  const backgroundImageUrl = homeStore((s) => s.backgroundImageUrl)
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const bgUrl =
    (webcamStatus || captureStatus) && useVideoAsBackground
      ? ''
      : backgroundImageUrl === 'green'
        ? ''
        : `url(${buildUrl(backgroundImageUrl)})`
  const messageReceiverEnabled = settingsStore((s) => s.messageReceiverEnabled)
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)
  const realtimeAPIMode = settingsStore((s) => s.realtimeAPIMode)
  const youtubeMode = settingsStore((s) => s.youtubeMode)
  const modelType = settingsStore((s) => s.modelType)
  const isMobileLayout = useIsMobileLayout()
  const isDedicatedMobileWindow = useIsDedicatedMobileWindow()
  const dragStateRef = useRef<{
    pointerId: number
    startPointerX: number
    startPointerY: number
    startWindowX: number
    startWindowY: number
  } | null>(null)
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  const dragSurfaceElementRef = useRef<HTMLDivElement | null>(null)
  const { isLive2DEnabled } = useLive2DEnabled()
  const characterPreset1 = settingsStore((s) => s.characterPreset1)
  const characterPreset2 = settingsStore((s) => s.characterPreset2)
  const characterPreset3 = settingsStore((s) => s.characterPreset3)
  const characterPreset4 = settingsStore((s) => s.characterPreset4)
  const characterPreset5 = settingsStore((s) => s.characterPreset5)
  const { t } = useTranslation()
  usePresetLoader()
  const characterPresets = useMemo(
    () => [
      { key: 'characterPreset1', value: characterPreset1 },
      { key: 'characterPreset2', value: characterPreset2 },
      { key: 'characterPreset3', value: characterPreset3 },
      { key: 'characterPreset4', value: characterPreset4 },
      { key: 'characterPreset5', value: characterPreset5 },
    ],
    [
      characterPreset1,
      characterPreset2,
      characterPreset3,
      characterPreset4,
      characterPreset5,
    ]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        // shift郢ｧ・ｭ郢晢ｽｼ郢ｧ蜻域ｬｾ邵ｺ蜉ｱ竊醍ｸｺ蠕鯉ｽ芽ｬｨ・ｰ陝・干縺冗ｹ晢ｽｼ郢ｧ蜻域ｬｾ邵ｺ蜷ｶ笳・ｹｧ竏壹・郢晄ｧｭ繝｣郢晄鱒ﾎｦ郢ｧ・ｰ
        const keyMap: { [key: string]: number } = {
          Digit1: 1,
          Digit2: 2,
          Digit3: 3,
          Digit4: 4,
          Digit5: 5,
        }

        const keyNumber = keyMap[event.code]

        if (keyNumber) {
          settingsStore.setState({
            systemPrompt: characterPresets[keyNumber - 1].value,
          })
          toastStore.getState().addToast({
            message: t('Toasts.PresetSwitching', {
              presetName: t(`Characterpreset${keyNumber}`),
            }),
            type: 'info',
            tag: `character-preset-switching`,
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [characterPresets, t])

  useEffect(() => {
    document.documentElement.classList.toggle(
      'mobile-window-layout',
      isDedicatedMobileWindow
    )
    return () => {
      document.documentElement.classList.remove('mobile-window-layout')
    }
  }, [isDedicatedMobileWindow])

  const flushWindowPosition = useCallback(() => {
    rafRef.current = null
    const pending = pendingPositionRef.current
    pendingPositionRef.current = null
    if (!pending) return
    void window.electronApp?.setMobileWindowPosition?.(pending.x, pending.y)
  }, [])

  const scheduleWindowPosition = useCallback(
    (x: number, y: number) => {
      pendingPositionRef.current = { x, y }
      if (rafRef.current !== null) return
      rafRef.current = window.requestAnimationFrame(flushWindowPosition)
    },
    [flushWindowPosition]
  )

  const handleDragPointerMove = useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current
      if (!dragState || event.pointerId !== dragState.pointerId) return
      const x =
        dragState.startWindowX + (event.screenX - dragState.startPointerX)
      const y =
        dragState.startWindowY + (event.screenY - dragState.startPointerY)
      scheduleWindowPosition(x, y)
    },
    [scheduleWindowPosition]
  )

  const handleDragPointerEnd = useCallback(
    function onDragPointerEnd(event: PointerEvent) {
      const dragState = dragStateRef.current
      if (!dragState || event.pointerId !== dragState.pointerId) return
      dragStateRef.current = null
      const dragSurface = dragSurfaceElementRef.current
      if (dragSurface?.hasPointerCapture(event.pointerId)) {
        dragSurface.releasePointerCapture(event.pointerId)
      }
      dragSurfaceElementRef.current = null
      window.removeEventListener('pointermove', handleDragPointerMove)
      window.removeEventListener('pointerup', onDragPointerEnd)
      window.removeEventListener('pointercancel', onDragPointerEnd)
    },
    [handleDragPointerMove]
  )

  const handleDragHandlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDedicatedMobileWindow) return
      if (!window.electronApp?.setMobileWindowPosition) return
      if (event.button !== 0) return
      const target = event.target
      const isDragHandle =
        target instanceof Element
          ? Boolean(target.closest('[data-window-drag-handle="true"]'))
          : false
      if (
        !isDragHandle &&
        target instanceof Element &&
        target.closest('[data-no-window-drag="true"]') &&
        !event.altKey
      ) {
        return
      }
      if (
        !isDragHandle &&
        target instanceof Element &&
        target.closest(
          'button, input, textarea, select, option, label, a, [role="button"], [contenteditable="true"]'
        )
      ) {
        return
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      dragSurfaceElementRef.current = event.currentTarget

      dragStateRef.current = {
        pointerId: event.pointerId,
        startPointerX: event.screenX,
        startPointerY: event.screenY,
        startWindowX: window.screenX,
        startWindowY: window.screenY,
      }

      window.addEventListener('pointermove', handleDragPointerMove)
      window.addEventListener('pointerup', handleDragPointerEnd)
      window.addEventListener('pointercancel', handleDragPointerEnd)
    },
    [isDedicatedMobileWindow, handleDragPointerEnd, handleDragPointerMove]
  )

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
      window.removeEventListener('pointermove', handleDragPointerMove)
      window.removeEventListener('pointerup', handleDragPointerEnd)
      window.removeEventListener('pointercancel', handleDragPointerEnd)
    }
  }, [handleDragPointerEnd, handleDragPointerMove])

  const backgroundStyle = isMobileLayout
    ? { backgroundColor: 'transparent' }
    : (webcamStatus || captureStatus) && useVideoAsBackground
      ? {}
      : backgroundImageUrl === 'green'
        ? { backgroundColor: '#00FF00' }
        : { backgroundImage: bgUrl }

  return (
    <div
      className={`h-[100svh] bg-cover ${isDedicatedMobileWindow ? 'mobile-window-draggable' : ''}`}
      style={backgroundStyle}
      onPointerDown={handleDragHandlePointerDown}
    >
      {isDedicatedMobileWindow && (
        <div className="pointer-events-none absolute top-2 left-0 right-0 z-50 flex justify-center">
          <div
            className="pointer-events-auto rounded-md bg-black/55 px-3 py-1 text-xs text-white/90"
            data-window-drag-handle="true"
            title="ドラッグでウインドウ移動 / Alt+ドラッグでも移動"
          >
            Drag Window
          </div>
        </div>
      )}
      <Meta />
      {!isMobileLayout && <Introduction />}
      {isMobileLayout ? (
        <VrmViewer />
      ) : modelType === 'live2d' && isLive2DEnabled ? (
        <Live2DViewer />
      ) : modelType === 'pngtuber' ? (
        <PNGTuberViewer />
      ) : (
        <VrmViewer />
      )}
      <Form />
      {!isMobileLayout && <Menu />}
      {!isMobileLayout && <ModalImage />}
      {!isMobileLayout && messageReceiverEnabled && <MessageReceiver />}
      {!isMobileLayout && <Toasts />}
      {(externalLinkageMode || realtimeAPIMode) && <WebSocketManager />}
      {youtubeMode && <YoutubeManager />}
      <MemoryServiceInitializer />
      {!isMobileLayout && <CharacterPresetMenu />}
      {!isMobileLayout && <ImageOverlay />}
      <PresenceManager />
      {!isMobileLayout && (
        <div className="absolute top-4 left-4 z-30">
          <IdleManager />
        </div>
      )}
      {!isMobileLayout && <KioskOverlay />}
    </div>
  )
}

export default Home
