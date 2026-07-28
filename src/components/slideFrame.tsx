import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDraggable } from '@/hooks/useDraggable'
import { ResizeDetails, useResizable } from '@/hooks/useResizable'

const SLIDE_ASPECT_RATIO = 16 / 9
const VIEWPORT_PADDING = 12
const CONTROLS_SPACE = 96

interface SlideFrameProps {
  children: React.ReactNode
  controls: React.ReactNode
  visible?: boolean
}

const fitSlideToBounds = (maxWidth: number, maxHeight: number) => {
  const width = Math.min(maxWidth, maxHeight * SLIDE_ASPECT_RATIO)
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(width / SLIDE_ASPECT_RATIO)),
  }
}

const getViewportBounds = () => ({
  width: typeof window === 'undefined' ? 1920 : window.innerWidth,
  height: typeof window === 'undefined' ? 1080 : window.innerHeight,
})

const getInitialSlideSize = (viewport: { width: number; height: number }) =>
  fitSlideToBounds(viewport.width * 0.8, viewport.height * 0.7)

const resizePositionOffset = ({ direction, deltaSize }: ResizeDetails) => ({
  x: direction.includes('right')
    ? deltaSize.width / 2
    : direction.includes('left')
      ? -deltaSize.width / 2
      : 0,
  y: direction.includes('bottom')
    ? deltaSize.height / 2
    : direction.includes('top')
      ? -deltaSize.height / 2
      : 0,
})

const resizeHandles = [
  {
    direction: 'top-left',
    position: '-left-2 -top-2',
    cursor: 'nwse-resize',
  },
  {
    direction: 'top-right',
    position: '-right-2 -top-2',
    cursor: 'nesw-resize',
  },
  {
    direction: 'bottom-left',
    position: '-bottom-2 -left-2',
    cursor: 'nesw-resize',
  },
  {
    direction: 'bottom-right',
    position: '-bottom-2 -right-2',
    cursor: 'nwse-resize',
  },
] as const

const SlideFrame: React.FC<SlideFrameProps> = ({
  children,
  controls,
  visible = true,
}) => {
  const frameRef = useRef<HTMLDivElement>(null)
  const resizeStartPositionRef = useRef({ x: 0, y: 0 })
  const interactionRef = useRef({ dragging: false, resizing: false })
  const initializedRef = useRef(false)
  const sizeRef = useRef({ width: 960, height: 540 })
  const [viewport, setViewport] = useState(getViewportBounds)
  const { position, isDragging, isMobile, handleMouseDown, setPosition } =
    useDraggable()

  const handleResize = useCallback(
    (details: ResizeDetails) => {
      const offset = resizePositionOffset(details)
      setPosition({
        x: resizeStartPositionRef.current.x + offset.x,
        y: resizeStartPositionRef.current.y + offset.y,
      })
    },
    [setPosition]
  )

  const { size, isResizing, handleResizeStart, setSize } = useResizable({
    initialWidth: 960,
    initialHeight: 540,
    minWidth: 240,
    minHeight: 135,
    maxWidth: Math.max(240, viewport.width - VIEWPORT_PADDING * 2),
    maxHeight: Math.max(
      135,
      viewport.height - CONTROLS_SPACE - VIEWPORT_PADDING * 2
    ),
    aspectRatio: true,
    onResize: handleResize,
  })

  useEffect(() => {
    sizeRef.current = size
  }, [size])

  const clampFrameToViewport = useCallback(() => {
    const frame = frameRef.current
    if (!frame || typeof window === 'undefined') return

    const bounds = frame.getBoundingClientRect()
    let offsetX = 0
    let offsetY = 0

    if (bounds.left < VIEWPORT_PADDING) {
      offsetX = VIEWPORT_PADDING - bounds.left
    } else if (bounds.right > window.innerWidth - VIEWPORT_PADDING) {
      offsetX = window.innerWidth - VIEWPORT_PADDING - bounds.right
    }

    if (bounds.top < VIEWPORT_PADDING) {
      offsetY = VIEWPORT_PADDING - bounds.top
    } else if (bounds.bottom > window.innerHeight - VIEWPORT_PADDING) {
      offsetY = window.innerHeight - VIEWPORT_PADDING - bounds.bottom
    }

    if (offsetX !== 0 || offsetY !== 0) {
      setPosition({
        x: position.x + offsetX,
        y: position.y + offsetY,
      })
    }
  }, [position.x, position.y, setPosition])

  useEffect(() => {
    const updateViewport = () => {
      const nextViewport = getViewportBounds()
      setViewport(nextViewport)

      if (!initializedRef.current) {
        initializedRef.current = true
        setSize(getInitialSlideSize(nextViewport))
        return
      }

      const maxSize = fitSlideToBounds(
        Math.max(240, nextViewport.width - VIEWPORT_PADDING * 2),
        Math.max(
          135,
          nextViewport.height - CONTROLS_SPACE - VIEWPORT_PADDING * 2
        )
      )
      if (
        sizeRef.current.width > maxSize.width ||
        sizeRef.current.height > maxSize.height
      ) {
        setSize(maxSize)
      }
    }

    const initialUpdate = window.setTimeout(updateViewport, 0)
    window.addEventListener('resize', updateViewport)
    return () => {
      window.clearTimeout(initialUpdate)
      window.removeEventListener('resize', updateViewport)
    }
  }, [setSize])

  useEffect(() => {
    const wasInteracting =
      interactionRef.current.dragging || interactionRef.current.resizing
    interactionRef.current = {
      dragging: isDragging,
      resizing: isResizing,
    }
    if (wasInteracting && !isDragging && !isResizing) {
      const animationFrame = window.requestAnimationFrame(clampFrameToViewport)
      return () => window.cancelAnimationFrame(animationFrame)
    }
  }, [clampFrameToViewport, isDragging, isResizing])

  const handleSlideMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isResizing || event.button !== 0) return
    const target = event.target as HTMLElement
    if (
      target.closest(
        'a, button, input, textarea, select, [data-slide-interactive="true"]'
      )
    ) {
      return
    }
    event.stopPropagation()
    handleMouseDown(event)
  }

  const handleSlideResizeStart = (
    event: React.MouseEvent,
    direction: string
  ) => {
    resizeStartPositionRef.current = position
    handleResizeStart(event, direction)
  }

  return (
    <div
      className="pointer-events-none fixed inset-0"
      data-testid="slide-mode-viewer"
      style={{ zIndex: 8, visibility: visible ? 'visible' : 'hidden' }}
      aria-hidden={!visible}
    >
      <div
        ref={frameRef}
        className="group pointer-events-auto fixed left-1/2 top-1/2 select-none"
        data-testid="slide-frame"
        style={{
          transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
          width: size.width,
        }}
      >
        <div
          className="relative"
          data-testid="slide-drag-surface"
          onDragStart={(event) => event.preventDefault()}
          onMouseDown={handleSlideMouseDown}
          style={{
            cursor: isMobile ? 'default' : isDragging ? 'grabbing' : 'grab',
            height: size.height,
            width: size.width,
          }}
        >
          {children}

          {!isMobile &&
            !isDragging &&
            resizeHandles.map(
              ({ direction, position: handlePosition, cursor }) => (
                <button
                  key={direction}
                  type="button"
                  aria-label={`Resize slide ${direction}`}
                  className={`pointer-events-none absolute ${handlePosition} h-4 w-4 rounded-full border border-white bg-blue-500 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 hover:opacity-100 focus:opacity-100 focus:outline-none`}
                  data-slide-interactive="true"
                  data-testid={`slide-resize-${direction}`}
                  onMouseDown={(event) =>
                    handleSlideResizeStart(event, direction)
                  }
                  style={{ cursor }}
                />
              )
            )}

          {(isDragging || isResizing) && (
            <div
              className={`pointer-events-none absolute inset-0 border-2 border-dashed ${
                isResizing
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-blue-500 bg-blue-500/10'
              }`}
              data-testid="slide-interaction-indicator"
            />
          )}
        </div>

        <div
          className="mt-2"
          data-slide-interactive="true"
          data-testid="slide-frame-controls"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {controls}
        </div>
      </div>
    </div>
  )
}

export default SlideFrame
