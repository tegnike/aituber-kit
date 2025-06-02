import { useCallback, useEffect, useRef, useState } from 'react'

interface Position {
  x: number
  y: number
}

export const useDraggable = (initialPosition?: Position) => {
  const [position, setPosition] = useState<Position>(
    initialPosition || { x: 0, y: 0 }
  )
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dragStartPos = useRef<Position>({ x: 0, y: 0 })
  const elementStartPos = useRef<Position>({ x: 0, y: 0 })

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return
      }
      setIsMobile(
        window.innerWidth <= 768 ||
          /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      )
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return // Disable drag on mobile

      e.preventDefault()
      setIsDragging(true)
      dragStartPos.current = { x: e.clientX, y: e.clientY }
      elementStartPos.current = position
    },
    [position, isMobile]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || isMobile) return

      const deltaX = e.clientX - dragStartPos.current.x
      const deltaY = e.clientY - dragStartPos.current.y

      setPosition({
        x: elementStartPos.current.x + deltaX,
        y: elementStartPos.current.y + deltaY,
      })
    },
    [isDragging, isMobile]
  )

  const handleMouseUp = useCallback(() => {
    if (isMobile) return
    setIsDragging(false)
  }, [isMobile])

  useEffect(() => {
    if (isDragging && !isMobile) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, isMobile])

  const resetPosition = useCallback(() => {
    setPosition(initialPosition || { x: 0, y: 0 })
  }, [initialPosition])

  return {
    position,
    isDragging,
    isMobile,
    handleMouseDown,
    resetPosition,
    style: {
      transform: `translate(${position.x}px, ${position.y}px)`,
      cursor: isMobile ? 'default' : isDragging ? 'grabbing' : 'grab',
    },
  }
}
