import { useState, useCallback, useRef, useEffect } from 'react'

interface ResizableOptions {
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  aspectRatio?: boolean
  initialWidth?: number
  initialHeight?: number
}

export const useResizable = (options: ResizableOptions = {}) => {
  const {
    minWidth = 200,
    minHeight = 150,
    maxWidth = typeof window === 'undefined' ? 1024 : window.innerWidth * 0.8,
    maxHeight = typeof window === 'undefined' ? 768 : window.innerHeight * 0.8,
    aspectRatio = true,
    initialWidth = 512,
    initialHeight = 384,
  } = options

  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  })
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

      const getCursorForDirection = (direction: string) => {
        if (direction.includes('right') && direction.includes('top'))
          return 'nesw-resize'
        if (direction.includes('right') && direction.includes('bottom'))
          return 'nwse-resize'
        if (direction.includes('left') && direction.includes('top'))
          return 'nwse-resize'
        if (direction.includes('left') && direction.includes('bottom'))
          return 'nesw-resize'
        if (direction.includes('right') || direction.includes('left'))
          return 'ew-resize'
        return 'ns-resize'
      }
      document.body.style.cursor = getCursorForDirection(
        resizeDirectionRef.current || ''
      )

      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.style.cursor = 'auto'
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])

  const resetSize = useCallback(() => {
    setSize({ width: initialWidth, height: initialHeight })
  }, [initialWidth, initialHeight])

  return {
    size,
    isResizing,
    handleResizeStart,
    resetSize,
  }
}
