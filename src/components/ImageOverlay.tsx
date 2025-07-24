import React from 'react'
import PlacedImage from './placedImage'
import useImagesStore from '@/features/stores/images'

const ImageOverlay: React.FC = () => {
  const { placedImages } = useImagesStore()

  if (placedImages.length === 0) {
    return null
  }

  // Separate images by their layer position
  const behindCharacterImages = placedImages.filter(
    (img) => img.behindCharacter
  )
  const frontOfCharacterImages = placedImages.filter(
    (img) => !img.behindCharacter
  )

  return (
    <>
      {/* Images behind character (z-1 to z-4) */}
      {behindCharacterImages.length > 0 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {behindCharacterImages.map((image) => (
            <div key={image.id} className="pointer-events-auto group">
              <PlacedImage image={image} />
            </div>
          ))}
        </div>
      )}

      {/* Images in front of character (z-6 to z-19) */}
      {frontOfCharacterImages.length > 0 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 6 }}
        >
          {frontOfCharacterImages.map((image) => (
            <div key={image.id} className="pointer-events-auto group">
              <PlacedImage image={image} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default ImageOverlay
