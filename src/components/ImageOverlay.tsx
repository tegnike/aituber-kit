import React from 'react'
import PlacedImage from './PlacedImage'
import useImagesStore from '@/features/stores/images'

const ImageOverlay: React.FC = () => {
  const { placedImages } = useImagesStore()

  if (placedImages.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {placedImages.map((image) => (
        <div key={image.id} className="pointer-events-auto group">
          <PlacedImage image={image} />
        </div>
      ))}
    </div>
  )
}

export default ImageOverlay