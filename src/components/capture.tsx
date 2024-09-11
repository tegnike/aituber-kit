import { useRef, useState, useEffect, useCallback } from 'react'
import homeStore from '@/features/stores/home'
import { IconButton } from './iconButton'

const Capture = () => {
  const triggerShutter = homeStore((s) => s.triggerShutter)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const captureStartedRef = useRef<boolean>(false)

  const [permissionGranted, setPermissionGranted] = useState<boolean>(false)
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(true)

  // 初回のみ許可を要求するために useRef で状態を保持
  const requestCapturePermissionAttempted = useRef<boolean>(false)

  // Capture permission request
  const requestCapturePermission = async () => {
    try {
      if (!navigator.mediaDevices) {
        throw new Error('Media Devices API non supported.')
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })
      mediaStreamRef.current = stream
      console.log('MediaStream obtained:', mediaStreamRef.current)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPermissionGranted(true)
      // menuStore.setState({ capturePermissionGranted: true })
      setShowPermissionModal(false)
    } catch (error) {
      console.error('Error capturing display:', error)
      setShowPermissionModal(true)
    }
  }

  useEffect(() => {
    // 初回のみ許可を要求
    if (!requestCapturePermissionAttempted.current && !permissionGranted) {
      requestCapturePermission()
      requestCapturePermissionAttempted.current = true
    }
  }, [permissionGranted])

  const startCapture = async () => {
    // すでに画面共有中の場合は停止
    if (captureStartedRef.current && mediaStreamRef.current) {
      const tracks = mediaStreamRef.current.getTracks()
      tracks.forEach((track) => track.stop())
      mediaStreamRef.current = null
      captureStartedRef.current = false
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }

    // 新たに画面共有を開始
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })
      mediaStreamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        captureStartedRef.current = true
      }
    } catch (error) {
      console.error('Error capturing display:', error)
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
    const videoElement = videoRef.current

    return () => {
      if (mediaStreamRef.current) {
        const tracks = mediaStreamRef.current.getTracks()
        tracks.forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
      captureStartedRef.current = false
      if (videoElement) {
        videoElement.srcObject = null
      }
    }
  }, [])

  return (
    <div className="absolute row-span-1 flex right-0 max-h-[40vh] z-10">
      <div className="relative w-full md:max-w-[512px] max-w-[50%] m-16">
        <video ref={videoRef} autoPlay playsInline width={512} height={512} />

        <div className="md:block hidden absolute top-4 right-4">
          <IconButton
            iconName="24/Reload"
            className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled m-8"
            isProcessing={false}
            onClick={startCapture}
          />
        </div>
        <div className="block absolute bottom-4 right-4">
          <IconButton
            iconName="24/Shutter"
            className="z-30 bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled m-8"
            isProcessing={false}
            onClick={handleCapture}
          />
        </div>
      </div>
    </div>
  )
}

export default Capture
