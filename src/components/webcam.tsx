import React, { useEffect, useRef, useState, useCallback } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { IconButton } from './iconButton'

export const Webcam = () => {
  const triggerShutter = homeStore((s) => s.triggerShutter)
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [showRotateButton, setShowRotateButton] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const backgroundVideoRef = useRef<HTMLVideoElement>(null)

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices) return
    try {
      const latestDevices = (
        await navigator.mediaDevices.enumerateDevices()
      ).filter((d) => d.kind === 'videoinput')
      setDevices(latestDevices)
      setShowRotateButton(latestDevices.length > 1)
      if (latestDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(latestDevices[0].deviceId)
      }
    } catch (error) {
      console.error('Error refreshing devices:', error)
    }
  }, [selectedDevice])

  useEffect(() => {
    refreshDevices()
    const handleDeviceChange = () => {
      refreshDevices()
    }
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices?.removeEventListener(
        'devicechange',
        handleDeviceChange
      )
    }
  }, [refreshDevices])

  useEffect(() => {
    if (useVideoAsBackground && videoRef.current?.srcObject) {
      if (backgroundVideoRef.current) {
        backgroundVideoRef.current.srcObject = videoRef.current.srcObject
      }
    } else if (!useVideoAsBackground) {
      if (backgroundVideoRef.current) {
        backgroundVideoRef.current.srcObject = null
      }
    }
  }, [useVideoAsBackground])

  const initializeCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !selectedDevice) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: selectedDevice } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      if (backgroundVideoRef.current && useVideoAsBackground) {
        backgroundVideoRef.current.srcObject = stream
      }
    } catch (e) {
      console.error('Error initializing camera:', e)
    }
  }, [selectedDevice, useVideoAsBackground])

  useEffect(() => {
    initializeCamera()
  }, [initializeCamera])

  const handleRotateCamera = useCallback(() => {
    if (!navigator.mediaDevices || devices.length < 2) return
    const currentIndex = devices.findIndex((d) => d.deviceId === selectedDevice)
    const nextIndex = (currentIndex + 1) % devices.length
    const newDevice = devices[nextIndex].deviceId
    console.log('Current device:', selectedDevice)
    console.log('New device:', newDevice)
    setSelectedDevice(newDevice)
  }, [devices, selectedDevice])

  useEffect(() => {
    console.log('Selected device changed:', selectedDevice)
    initializeCamera()
  }, [selectedDevice, initializeCamera])

  const handleCapture = useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current!.videoWidth
    canvas.height = videoRef.current!.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(videoRef.current!, 0, 0)
    const data = canvas.toDataURL('image/png')

    if (data !== '') {
      console.log('capture')
      homeStore.setState({
        modalImage: data,
        triggerShutter: false, // シャッターをリセット
      })
    } else {
      homeStore.setState({ modalImage: '' })
    }
  }, [])

  useEffect(() => {
    if (triggerShutter) {
      handleCapture()
    }
  }, [triggerShutter, handleCapture])

  return (
    <>
      {useVideoAsBackground && (
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
            width={512}
            height={512}
            id="local-video"
            autoPlay
            playsInline
            muted
            className={`rounded-lg w-auto object-contain max-h-[100%] ml-auto ${
              useVideoAsBackground ? 'invisible' : ''
            }`}
          />
          <div className="md:block absolute top-2 right-2">
            <IconButton
              iconName="24/Roll"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled m-2"
              isProcessing={false}
              disabled={!showRotateButton}
              onClick={handleRotateCamera}
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
