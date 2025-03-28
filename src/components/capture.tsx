import { useRef, useState, useEffect, useCallback } from 'react'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { IconButton } from './iconButton'

const Capture = () => {
  const triggerShutter = homeStore((s) => s.triggerShutter)
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const videoRef = useRef<HTMLVideoElement>(null)
  const backgroundVideoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const captureStartedRef = useRef<boolean>(false)

  const [permissionGranted, setPermissionGranted] = useState<boolean>(false)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(true)

  // 初回のみ許可を要求するために useRef で状態を保持
  const requestCapturePermissionAttempted = useRef<boolean>(false)

  // ストリームの設定を一元管理する関数
  const setupStream = async (stream: MediaStream) => {
    mediaStreamRef.current = stream
    captureStartedRef.current = true
    homeStore.setState({ captureStatus: true })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }
    if (backgroundVideoRef.current && useVideoAsBackground) {
      backgroundVideoRef.current.srcObject = stream
      await backgroundVideoRef.current.play()
    }
  }

  // ストリームのクリーンアップを一元管理する関数
  const cleanupStream = () => {
    if (mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks()
      tracks.forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    captureStartedRef.current = false
    homeStore.setState({ captureStatus: false })

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (backgroundVideoRef.current) {
      backgroundVideoRef.current.srcObject = null
    }
  }

  // Capture permission request
  const requestCapturePermission = async () => {
    try {
      if (!navigator.mediaDevices) {
        throw new Error('Media Devices API non supported.')
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })
      await setupStream(stream)
      setPermissionGranted(true)
      setShowPermissionModal(false)
    } catch (error) {
      console.error('Error capturing display:', error)
      setShowPermissionModal(true)
      cleanupStream()
    }
  }

  useEffect(() => {
    // 初回のみ許可を要求
    if (!requestCapturePermissionAttempted.current && !permissionGranted) {
      requestCapturePermission()
      requestCapturePermissionAttempted.current = true
    }
  }, [permissionGranted])

  useEffect(() => {
    if (useVideoAsBackground && mediaStreamRef.current) {
      if (backgroundVideoRef.current) {
        backgroundVideoRef.current.srcObject = mediaStreamRef.current
        backgroundVideoRef.current.play().catch(console.error)
      }
    } else {
      if (backgroundVideoRef.current) {
        backgroundVideoRef.current.srcObject = null
      }
    }
  }, [useVideoAsBackground])

  const startCapture = async () => {
    // すでに画面共有中の場合は停止
    if (captureStartedRef.current) {
      cleanupStream()
      return
    }

    // 新たに画面共有を開始
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })
      await setupStream(stream)
    } catch (error) {
      console.error('Error capturing display:', error)
      cleanupStream()
    }
  }

  const handleCapture = useCallback(() => {
    if (videoRef.current && mediaStreamRef.current) {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      const { videoWidth, videoHeight } = videoRef.current

      canvas.width = videoWidth
      canvas.height = videoHeight
      context?.drawImage(videoRef.current, 0, 0)

      const dataUrl = canvas.toDataURL('image/png')

      if (dataUrl !== '') {
        console.log('capture')
        homeStore.setState({
          modalImage: dataUrl,
          triggerShutter: false, // シャッターをリセット
        })
      } else {
        homeStore.setState({ modalImage: '' })
      }
    } else {
      console.error('Video or media stream is not available')
    }
  }, [])

  useEffect(() => {
    if (triggerShutter) {
      handleCapture()
    }
  }, [triggerShutter, handleCapture])

  useEffect(() => {
    return () => {
      cleanupStream()
    }
  }, [])

  return (
    <>
      {useVideoAsBackground && mediaStreamRef.current && (
        <video
          ref={backgroundVideoRef}
          autoPlay
          playsInline
          muted
          className="fixed top-0 left-0 w-full h-full object-cover -z-10"
        />
      )}
      <div className="absolute row-span-1 flex right-0 max-h-[40vh] z-10">
        <div className="relative w-full md:max-w-[512px] max-w-[70%] m-4 md:m-4 ml-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width={512}
            height={512}
            className={useVideoAsBackground ? 'invisible' : ''}
          />
          <div className="md:block absolute top-2 right-2">
            <IconButton
              iconName="24/Reload"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled m-2"
              isProcessing={false}
              onClick={startCapture}
            />
            <IconButton
              iconName="24/Shutter"
              className="z-30 bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled m-2"
              isProcessing={false}
              onClick={handleCapture}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default Capture
