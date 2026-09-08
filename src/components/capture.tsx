import { logger } from '@/lib/logger'
import { useRef, useState, useEffect, useCallback } from 'react'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import CaptureService from '@/features/gameCommentary/captureService'
import { getDisplayMediaOptions } from '@/features/vrmViewer/screenLighting'
import { useScreenLighting } from '@/features/vrmViewer/useScreenLighting'
import { VideoDisplay } from './common/VideoDisplay'

const Capture = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const captureStartedRef = useRef<boolean>(false)

  const [permissionGranted, setPermissionGranted] = useState<boolean>(false)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(true)
  const screenLightingEnabled = settingsStore(
    (state) => state.screenLightingEnabled
  )
  const screenLightingCaptureOwned = menuStore(
    (state) => state.screenLightingCaptureOwned
  )
  const modelType = settingsStore((state) => state.modelType)
  const screenLightingActive = modelType === 'vrm' && screenLightingEnabled

  useScreenLighting(videoRef, screenLightingActive)

  // 初回のみ許可を要求するために useRef で状態を保持
  const requestCapturePermissionAttempted = useRef<boolean>(false)

  // ストリームのクリーンアップを一元管理する関数
  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks()
      tracks.forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    captureStartedRef.current = false
    homeStore.setState({ captureStatus: false })

    // CaptureServiceのキャプチャ関数を解除
    CaptureService.getInstance().registerCaptureFunction(null)
    homeStore.getState().viewer.resetScreenLighting()

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const stopCapture = useCallback(() => {
    cleanupStream()
    settingsStore.setState({
      hideVideoDisplay: false,
      useVideoAsBackground: false,
      screenLightingEnabled: false,
    })
    menuStore.setState({
      showCapture: false,
      screenLightingCaptureOwned: false,
    })
  }, [cleanupStream])

  // ストリームの設定を一元管理する関数
  const setupStream = useCallback(
    async (stream: MediaStream) => {
      mediaStreamRef.current = stream
      captureStartedRef.current = true
      homeStore.setState({ captureStatus: true })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // CaptureServiceにキャプチャ関数を登録
      // リサイズはvideo要素から直接スケーリング描画する（Imageのデコード待ちが不要で同期的に完結する）
      CaptureService.getInstance().registerCaptureFunction(
        (maxWidth?: number, quality?: number) => {
          const video = videoRef.current
          if (!video || video.readyState < 2) return null
          const sourceWidth = video.videoWidth
          const sourceHeight = video.videoHeight
          if (!sourceWidth || !sourceHeight) return null

          const scale =
            maxWidth && maxWidth > 0 && sourceWidth > maxWidth
              ? maxWidth / sourceWidth
              : 1
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(sourceWidth * scale)
          canvas.height = Math.round(sourceHeight * scale)
          const ctx = canvas.getContext('2d')
          if (!ctx) return null
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          return canvas.toDataURL('image/jpeg', quality ?? 0.9)
        }
      )

      // track endedイベント監視（ブラウザ側で共有停止された時の検知）
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          stopCapture()
        })
      })
    },
    [stopCapture]
  )

  // Capture permission request
  const requestCapturePermission = useCallback(async () => {
    try {
      if (!navigator.mediaDevices) {
        throw new Error('Media Devices API non supported.')
      }
      const { screenLightingCaptureOwned } = menuStore.getState()
      const stream = await navigator.mediaDevices.getDisplayMedia(
        getDisplayMediaOptions(screenLightingCaptureOwned)
      )
      await setupStream(stream)
      setPermissionGranted(true)
      setShowPermissionModal(false)
    } catch (error) {
      logger.error('Error capturing display:', error)
      setShowPermissionModal(true)
      cleanupStream()
      const { screenLightingCaptureOwned } = menuStore.getState()
      if (screenLightingCaptureOwned) {
        settingsStore.setState({ screenLightingEnabled: false })
        menuStore.setState({
          showCapture: false,
          screenLightingCaptureOwned: false,
        })
      }
    }
  }, [setupStream, cleanupStream])

  useEffect(() => {
    // 初回のみ許可を要求
    if (!requestCapturePermissionAttempted.current && !permissionGranted) {
      requestCapturePermission()
      requestCapturePermissionAttempted.current = true
    }
  }, [permissionGranted, requestCapturePermission])

  const startCapture = async () => {
    // すでに画面共有中の場合は停止
    if (captureStartedRef.current) {
      stopCapture()
      return
    }

    // 新たに画面共有を開始
    try {
      const { screenLightingCaptureOwned } = menuStore.getState()
      const stream = await navigator.mediaDevices.getDisplayMedia(
        getDisplayMediaOptions(screenLightingCaptureOwned)
      )
      await setupStream(stream)
    } catch (error) {
      logger.error('Error capturing display:', error)
      cleanupStream()
    }
  }

  useEffect(() => {
    return () => {
      cleanupStream()
    }
  }, [cleanupStream])

  return (
    <VideoDisplay
      videoRef={videoRef}
      mediaStream={mediaStreamRef.current}
      integrateIntoScene={screenLightingActive}
      onToggleSource={startCapture}
      onStopSource={stopCapture}
      toggleSourceIcon="24/Reload"
      showToggleButton={true}
    />
  )
}

export default Capture
