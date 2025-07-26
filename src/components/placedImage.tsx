import React, { useCallback, useMemo } from 'react'
import { useDraggable } from '@/hooks/useDraggable'
import { useResizable } from '@/hooks/useResizable'
import useImagesStore, {
  PlacedImage as PlacedImageType,
} from '@/features/stores/images'
import { debounce } from '@/utils/debounce'
import { IMAGE_CONSTANTS } from '@/constants/images'

interface PlacedImageProps {
  image: PlacedImageType
  onPositionChange?: (id: string, position: { x: number; y: number }) => void
  onSizeChange?: (id: string, size: { width: number; height: number }) => void
}

const PlacedImage: React.FC<PlacedImageProps> = ({
  image,
  onPositionChange,
  onSizeChange,
}) => {
  const { updatePlacedImagePosition, updatePlacedImageSize } = useImagesStore()

  // Debounced update functions
  const debouncedPositionUpdate = useMemo(
    () =>
      debounce((position: { x: number; y: number }) => {
        updatePlacedImagePosition(image.id, position)
        onPositionChange?.(image.id, position)
      }, IMAGE_CONSTANTS.DEBOUNCE_DELAY),
    [image.id, updatePlacedImagePosition, onPositionChange]
  )

  const debouncedSizeUpdate = useMemo(
    () =>
      debounce((size: { width: number; height: number }) => {
        updatePlacedImageSize(image.id, size)
        onSizeChange?.(image.id, size)
      }, IMAGE_CONSTANTS.DEBOUNCE_DELAY),
    [image.id, updatePlacedImageSize, onSizeChange]
  )

  const handlePositionChange = useCallback(
    (position: { x: number; y: number }) => {
      debouncedPositionUpdate(position)
    },
    [debouncedPositionUpdate]
  )

  const handleSizeChange = useCallback(
    (size: { width: number; height: number }) => {
      debouncedSizeUpdate(size)
    },
    [debouncedSizeUpdate]
  )

  const {
    position,
    isDragging,
    handleMouseDown,
    style: dragStyle,
  } = useDraggable(image.position)

  const { size, isResizing, handleResizeStart } = useResizable({
    initialWidth: image.size.width,
    initialHeight: image.size.height,
    minWidth: IMAGE_CONSTANTS.DIMENSIONS.MIN_WIDTH,
    minHeight: IMAGE_CONSTANTS.DIMENSIONS.MIN_HEIGHT,
    maxWidth: IMAGE_CONSTANTS.DIMENSIONS.MAX_WIDTH,
    maxHeight: IMAGE_CONSTANTS.DIMENSIONS.MAX_HEIGHT,
    aspectRatio: false,
  })

  // Update position when dragging stops
  React.useEffect(() => {
    if (
      !isDragging &&
      (position.x !== image.position.x || position.y !== image.position.y)
    ) {
      handlePositionChange(position)
    }
  }, [isDragging, position, image.position, handlePositionChange])

  // Update size when resizing stops
  React.useEffect(() => {
    if (
      !isResizing &&
      (size.width !== image.size.width || size.height !== image.size.height)
    ) {
      handleSizeChange(size)
    }
  }, [isResizing, size, image.size, handleSizeChange])

  return (
    <div
      className="absolute select-none group"
      style={{
        ...dragStyle,
        width: size.width,
        height: size.height,
        zIndex: image.zIndex,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {/* Image */}
      <img
        src={image.path}
        alt={image.filename}
        className="w-full h-full object-contain"
        draggable={false}
        onMouseDown={handleMouseDown}
      />

      {/* Resize handles */}
      {!isDragging && (
        <>
          {/* Corner handles */}
          <div
            className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nesw-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nesw-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />

          {/* Edge handles */}
          <div
            className="absolute -top-2 left-1/2 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity transform -translate-x-1/2"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            className="absolute -bottom-2 left-1/2 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity transform -translate-x-1/2"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="absolute -left-2 top-1/2 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity transform -translate-y-1/2"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="absolute -right-2 top-1/2 w-4 h-4 bg-blue-500 border border-white rounded-full cursor-ew-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity transform -translate-y-1/2"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg bg-blue-500 bg-opacity-10" />
      )}

      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute inset-0 border-2 border-green-500 border-dashed rounded-lg bg-green-500 bg-opacity-10" />
      )}
    </div>
  )
}

export default PlacedImage
