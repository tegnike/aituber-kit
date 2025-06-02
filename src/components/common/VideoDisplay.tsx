import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { IconButton } from '../iconButton'
import { useDraggable } from '@/hooks/useDraggable'
import { useResizable } from '@/hooks/useResizable'

interface VideoDisplayProps {
  videoRef: React.RefObject<HTMLVideoElement>
  mediaStream?: MediaStream | null
  onCapture?: () => void
  onToggleSource?: () => void
  toggleSourceIcon?: string
  toggleSourceDisabled?: boolean
  showToggleButton?: boolean
  className?: string
}

export const VideoDisplay = forwardRef<HTMLDivElement, VideoDisplayProps>(
  (
    {
      videoRef,
      mediaStream,
      onCapture,
      onToggleSource,
      toggleSourceIcon = '24/Roll',
      toggleSourceDisabled = false,
      showToggleButton = true,
      className = '',
    },
    ref
  ) => {
    const triggerShutter = homeStore((s) => s.triggerShutter)
    const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
    const backgroundVideoRef = useRef<HTMLVideoElement>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [videoBounds, setVideoBounds] = useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    })
    const {
      isMobile,
      handleMouseDown,
      resetPosition,
      style: dragStyle,
    } = useDraggable()
    const { size, isResizing, handleResizeStart, resetSize } = useResizable({
      aspectRatio: true,
    })

    // Handle background video sync
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

      return () => {
        if (backgroundVideoRef.current) {
          backgroundVideoRef.current.srcObject = null
        }
      }
    }, [useVideoAsBackground, videoRef])

    // Handle media stream updates
    useEffect(() => {
      if (mediaStream && useVideoAsBackground && backgroundVideoRef.current) {
        backgroundVideoRef.current.srcObject = mediaStream
        backgroundVideoRef.current.play().catch(console.error)
      }
    }, [mediaStream, useVideoAsBackground])

    const handleCapture = useCallback(() => {
      if (!videoRef.current) return
      if (
        videoRef.current.videoWidth === 0 ||
        videoRef.current.videoHeight === 0
      )
        return

      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(videoRef.current, 0, 0)
      const data = canvas.toDataURL('image/png')

      if (data !== '') {
        console.log('capture')
        homeStore.setState({
          modalImage: data,
          triggerShutter: false,
        })
      } else {
        homeStore.setState({ modalImage: '' })
      }

      onCapture?.()
    }, [videoRef, onCapture])

    useEffect(() => {
      if (triggerShutter) {
        handleCapture()
      }
    }, [triggerShutter, handleCapture])

    const handleExpand = useCallback(() => {
      setIsExpanded(!isExpanded)
      settingsStore.setState({ useVideoAsBackground: !isExpanded })
      resetPosition()
      resetSize()
    }, [isExpanded, resetPosition, resetSize])

    // Calculate actual video bounds within container
    const updateVideoBounds = useCallback(() => {
      if (!videoRef.current || !containerRef.current) return

      const video = videoRef.current
      if (video.videoHeight === 0 || video.videoWidth === 0) return

      const container = containerRef.current
      const videoAspectRatio = video.videoWidth / video.videoHeight
      const containerAspectRatio =
        container.clientWidth / container.clientHeight

      let actualWidth: number
      let actualHeight: number
      let offsetX = 0
      let offsetY = 0

      if (videoAspectRatio > containerAspectRatio) {
        // Video is wider than container
        actualWidth = container.clientWidth
        actualHeight = container.clientWidth / videoAspectRatio
        offsetY = 0 // Align to top
      } else {
        // Video is taller than container
        actualHeight = container.clientHeight
        actualWidth = container.clientHeight * videoAspectRatio
        offsetX = (container.clientWidth - actualWidth) / 2
      }

      setVideoBounds({
        x: offsetX,
        y: offsetY,
        width: actualWidth,
        height: actualHeight,
      })
    }, [videoRef])

    // Update bounds when size changes or video loads
    useEffect(() => {
      const video = videoRef.current
      if (!video) return

      const handleLoadedMetadata = () => {
        updateVideoBounds()
      }

      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      updateVideoBounds()

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }, [videoRef, size, updateVideoBounds])

    // Update bounds on resize
    useEffect(() => {
      updateVideoBounds()
    }, [size, updateVideoBounds])

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
        <div
          ref={ref}
          className={`fixed right-4 top-4 z-10 ${className}`}
          style={{
            ...dragStyle,
            width: isExpanded ? 'auto' : `${size.width}px`,
            height: isExpanded ? 'auto' : `${size.height}px`,
            maxWidth: isExpanded ? '70%' : 'none',
            maxHeight: isExpanded ? '40vh' : 'none',
          }}
        >
          <div
            ref={containerRef}
            className="relative w-full h-full select-none"
            onMouseDown={!isMobile && !isResizing ? handleMouseDown : undefined}
          >
            <video
              ref={videoRef}
              width={512}
              height={512}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-top ${
                useVideoAsBackground ? 'invisible' : ''
              }`}
            />
            {/* Resize handles */}
            {!isExpanded && !isMobile && videoBounds.width > 0 && (
              <>
                {/* Corner handles */}
                <div
                  className="absolute w-3 h-3 cursor-nwse-resize"
                  style={{
                    left: `${videoBounds.x}px`,
                    top: `${videoBounds.y}px`,
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'top-left')}
                />
                <div
                  className="absolute w-3 h-3 cursor-nesw-resize"
                  style={{
                    left: `${videoBounds.x + videoBounds.width - 12}px`,
                    top: `${videoBounds.y}px`,
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'top-right')}
                />
                <div
                  className="absolute w-3 h-3 cursor-nesw-resize"
                  style={{
                    left: `${videoBounds.x}px`,
                    top: `${videoBounds.y + videoBounds.height - 12}px`,
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
                />
                <div
                  className="absolute w-3 h-3 cursor-nwse-resize"
                  style={{
                    left: `${videoBounds.x + videoBounds.width - 12}px`,
                    top: `${videoBounds.y + videoBounds.height - 12}px`,
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
                />
                {/* Edge handles */}
                <div
                  className="absolute w-1/3 h-2 cursor-ns-resize"
                  style={{
                    left: `${videoBounds.x + videoBounds.width / 2}px`,
                    top: `${videoBounds.y}px`,
                    transform: 'translateX(-50%)',
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'top')}
                />
                <div
                  className="absolute w-1/3 h-2 cursor-ns-resize"
                  style={{
                    left: `${videoBounds.x + videoBounds.width / 2}px`,
                    top: `${videoBounds.y + videoBounds.height - 8}px`,
                    transform: 'translateX(-50%)',
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                />
                <div
                  className="absolute w-2 h-1/3 cursor-ew-resize"
                  style={{
                    left: `${videoBounds.x}px`,
                    top: `${videoBounds.y + videoBounds.height / 2}px`,
                    transform: 'translateY(-50%)',
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'left')}
                />
                <div
                  className="absolute w-2 h-1/3 cursor-ew-resize"
                  style={{
                    left: `${videoBounds.x + videoBounds.width - 8}px`,
                    top: `${videoBounds.y + videoBounds.height / 2}px`,
                    transform: 'translateY(-50%)',
                  }}
                  onMouseDown={(e) => handleResizeStart(e, 'right')}
                />
              </>
            )}
            <div className="md:block absolute top-2 right-2">
              {showToggleButton && (
                <IconButton
                  iconName={toggleSourceIcon}
                  className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled m-2"
                  isProcessing={false}
                  disabled={toggleSourceDisabled}
                  onClick={onToggleSource}
                />
              )}
              <IconButton
                iconName="24/Expand"
                className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled m-2"
                isProcessing={false}
                onClick={handleExpand}
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
)

VideoDisplay.displayName = 'VideoDisplay'
