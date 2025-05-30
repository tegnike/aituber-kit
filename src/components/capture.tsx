import { useRef, useState, useEffect, useCallback } from 'react'
import homeStore from '@/features/stores/home'
import { VideoDisplay } from './common/VideoDisplay'

const Capture = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const captureStartedRef = useRef<boolean>(false)

  const [permissionGranted, setPermissionGranted] = useState<boolean>(false)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(true)

  // 初回のみ許可を要求するために useRef で状態を保持
  const requestCapturePermissionAttempted = useRef<boolean>(false)

  // ストリームの設定を一元管理する関数
  const setupStream = useCallback(async (stream: MediaStream) => {
    mediaStreamRef.current = stream
    captureStartedRef.current = true
    homeStore.setState({ captureStatus: true })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }
  }, [])

  // ストリームのクリーンアップを一元管理する関数
  const cleanupStream = useCallback(() => {
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
  }, [])

  // Capture permission request
  const requestCapturePermission = useCallback(async () => {
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

  useEffect(() => {
    return () => {
      cleanupStream()
    }
  }, [cleanupStream])

  return (
    <VideoDisplay
      videoRef={videoRef}
      mediaStream={mediaStreamRef.current}
      onToggleSource={startCapture}
      toggleSourceIcon="24/Reload"
      showToggleButton={true}
    />
  )
}

export default Capture
