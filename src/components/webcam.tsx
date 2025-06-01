import React, { useEffect, useRef, useState, useCallback } from 'react'

import homeStore from '@/features/stores/home'
import { VideoDisplay } from './common/VideoDisplay'

export const Webcam = () => {
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [showRotateButton, setShowRotateButton] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

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
    } catch (e) {
      console.error('Error initializing camera:', e)
    }
  }, [selectedDevice])

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

  return (
    <VideoDisplay
      videoRef={videoRef}
      onToggleSource={handleRotateCamera}
      toggleSourceIcon="24/Roll"
      toggleSourceDisabled={!showRotateButton}
      showToggleButton={true}
    />
  )
}
