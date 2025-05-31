import { useState, useCallback, useRef, useEffect } from 'react'

interface ResizableOptions {
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  aspectRatio?: boolean
}

export const useResizable = (options: ResizableOptions = {}) => {
  const {
    minWidth = 200,
    minHeight = 150,
    maxWidth = window.innerWidth * 0.8,
    maxHeight = window.innerHeight * 0.8,
    aspectRatio = true,
  } = options

  const [size, setSize] = useState({ width: 512, height: 384 })
  const [isResizing, setIsResizing] = useState(false)
  const resizeDirectionRef = useRef<string | null>(null)
  const startSizeRef = useRef({ width: 0, height: 0 })
  const startPosRef = useRef({ x: 0, y: 0 })
  const aspectRatioRef = useRef(4 / 3)

  useEffect(() => {
    if (size.width && size.height) {
      aspectRatioRef.current = size.width / size.height
    }
  }, [size.width, size.height])

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      resizeDirectionRef.current = direction
      startSizeRef.current = { ...size }
      startPosRef.current = { x: e.clientX, y: e.clientY }
    },
    [size]
  )

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeDirectionRef.current) return

      const deltaX = e.clientX - startPosRef.current.x
      const deltaY = e.clientY - startPosRef.current.y
      const direction = resizeDirectionRef.current

      let newWidth = startSizeRef.current.width
      let newHeight = startSizeRef.current.height

      // Calculate new dimensions based on resize direction
      if (direction.includes('right')) {
        newWidth = startSizeRef.current.width + deltaX
      } else if (direction.includes('left')) {
        newWidth = startSizeRef.current.width - deltaX
      }

      if (direction.includes('bottom')) {
        newHeight = startSizeRef.current.height + deltaY
      } else if (direction.includes('top')) {
        newHeight = startSizeRef.current.height - deltaY
      }

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

      // Maintain aspect ratio if enabled
      if (aspectRatio) {
        if (direction === 'right' || direction === 'left') {
          newHeight = newWidth / aspectRatioRef.current
        } else if (direction === 'top' || direction === 'bottom') {
          newWidth = newHeight * aspectRatioRef.current
        } else {
          // For corner resizing, prioritize width changes
          newHeight = newWidth / aspectRatioRef.current
        }
      }

      setSize({ width: newWidth, height: newHeight })
    },
    [isResizing, minWidth, minHeight, maxWidth, maxHeight, aspectRatio]
  )

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
    resizeDirectionRef.current = null
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = resizeDirectionRef.current?.includes('right')
        ? resizeDirectionRef.current.includes('top') ||
          resizeDirectionRef.current.includes('bottom')
          ? resizeDirectionRef.current.includes('top')
            ? 'nesw-resize'
            : 'nwse-resize'
          : 'ew-resize'
        : resizeDirectionRef.current?.includes('left')
          ? resizeDirectionRef.current.includes('top') ||
            resizeDirectionRef.current.includes('bottom')
            ? resizeDirectionRef.current.includes('top')
              ? 'nwse-resize'
              : 'nesw-resize'
            : 'ew-resize'
          : 'ns-resize'

      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = 'auto'
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const resetSize = useCallback(() => {
    setSize({ width: 512, height: 384 })
  }, [])

  return {
    size,
    isResizing,
    handleResizeStart,
    resetSize,
  }
}
