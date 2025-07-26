import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UploadedImage {
  filename: string
  path: string
  uploadedAt: Date
}

export interface PlacedImage {
  id: string
  filename: string
  path: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  zIndex: number
  behindCharacter: boolean
}

export interface LayerItem {
  id: string
  type: 'character' | 'image'
  zIndex: number
  // For images
  filename?: string
  path?: string
  position?: {
    x: number
    y: number
  }
  size?: {
    width: number
    height: number
  }
  behindCharacter?: boolean
}

interface ImagesState {
  uploadedImages: UploadedImage[]
  placedImages: PlacedImage[]

  // Actions
  setUploadedImages: (images: UploadedImage[]) => void
  addUploadedImage: (image: UploadedImage) => void
  removeUploadedImage: (filename: string) => void
  addPlacedImage: (filename: string, path: string) => void
  removePlacedImage: (id: string) => void
  updatePlacedImagePosition: (
    id: string,
    position: { x: number; y: number }
  ) => void
  updatePlacedImageSize: (
    id: string,
    size: { width: number; height: number }
  ) => void
  updatePlacedImageZIndex: (id: string, zIndex: number) => void
  updateImageLayerPosition: (id: string, behindCharacter: boolean) => void
  reorderPlacedImages: (startIndex: number, endIndex: number) => void
  reorderAllLayers: (startIndex: number, endIndex: number) => void
  getAllLayerItems: () => LayerItem[]
  clearPlacedImages: () => void
}

const useImagesStore = create<ImagesState>()(
  persist(
    (set, get) => ({
      uploadedImages: [],
      placedImages: [],

      setUploadedImages: (images) => set({ uploadedImages: images }),

      addUploadedImage: (image) =>
        set((state) => ({
          uploadedImages: [image, ...state.uploadedImages],
        })),

      removeUploadedImage: (filename) =>
        set((state) => ({
          uploadedImages: state.uploadedImages.filter(
            (img) => img.filename !== filename
          ),
        })),

      addPlacedImage: (filename, path) => {
        const { placedImages } = get()

        // Check if we already have 5 images placed
        if (placedImages.length >= 5) {
          return
        }

        // Check if this image is already placed
        if (placedImages.some((img) => img.filename === filename)) {
          return
        }

        const newImage: PlacedImage = {
          id: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          filename,
          path,
          position: {
            x: 100 + placedImages.length * 50, // Offset each new image
            y: 100 + placedImages.length * 50,
          },
          size: {
            width: 200,
            height: 150,
          },
          zIndex: placedImages.length,
          behindCharacter: false, // Default to in front of character
        }

        set((state) => ({
          placedImages: [...state.placedImages, newImage],
        }))
      },

      removePlacedImage: (id) =>
        set((state) => ({
          placedImages: state.placedImages.filter((img) => img.id !== id),
        })),

      updatePlacedImagePosition: (id, position) =>
        set((state) => ({
          placedImages: state.placedImages.map((img) =>
            img.id === id ? { ...img, position } : img
          ),
        })),

      updatePlacedImageSize: (id, size) =>
        set((state) => ({
          placedImages: state.placedImages.map((img) =>
            img.id === id ? { ...img, size } : img
          ),
        })),

      updatePlacedImageZIndex: (id, zIndex) =>
        set((state) => ({
          placedImages: state.placedImages.map((img) =>
            img.id === id ? { ...img, zIndex } : img
          ),
        })),

      updateImageLayerPosition: (id, behindCharacter) => {
        set((state) => {
          const updatedImages = state.placedImages.map((img) =>
            img.id === id ? { ...img, behindCharacter } : img
          )

          // Recalculate z-indices based on layer positions
          const behindImages = updatedImages.filter(
            (img) => img.behindCharacter
          )
          const frontImages = updatedImages.filter(
            (img) => !img.behindCharacter
          )

          behindImages.forEach((img, index) => {
            img.zIndex = index + 1 // z-index 1-4 (behind character at z-5)
          })

          frontImages.forEach((img, index) => {
            img.zIndex = index + 6 // z-index 6+ (in front of character at z-5)
          })

          return { placedImages: updatedImages }
        })
      },

      reorderPlacedImages: (startIndex, endIndex) => {
        set((state) => {
          const result = Array.from(state.placedImages)
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)

          // Recalculate z-indices after reordering
          const behindImages = result.filter((img) => img.behindCharacter)
          const frontImages = result.filter((img) => !img.behindCharacter)

          behindImages.forEach((img, index) => {
            img.zIndex = index + 1 // z-index 1-4 (behind character at z-5)
          })

          frontImages.forEach((img, index) => {
            img.zIndex = index + 6 // z-index 6+ (in front of character at z-5)
          })

          return { placedImages: result }
        })
      },

      getAllLayerItems: () => {
        const { placedImages } = get()
        const layerItems: LayerItem[] = []

        // Add all images to the combined list
        placedImages.forEach((image) => {
          layerItems.push({
            id: image.id,
            type: 'image',
            zIndex: image.zIndex,
            filename: image.filename,
            path: image.path,
            position: image.position,
            size: image.size,
            behindCharacter: image.behindCharacter,
          })
        })

        // Add character item at z-index 5
        layerItems.push({
          id: 'character',
          type: 'character',
          zIndex: 5,
        })

        // Sort by z-index
        return layerItems.sort((a, b) => a.zIndex - b.zIndex)
      },

      reorderAllLayers: (startIndex, endIndex) => {
        set((state) => {
          const layerItems = get().getAllLayerItems()
          const result = Array.from(layerItems)
          const [removed] = result.splice(startIndex, 1)
          result.splice(endIndex, 0, removed)

          // Rebuild the z-index system
          const characterIndex = result.findIndex(
            (item) => item.type === 'character'
          )

          // Reassign z-indices based on new order
          result.forEach((item, index) => {
            if (item.type === 'character') {
              // Character always stays at z-index 5 conceptually
              // but we track its position in the visual list
              return
            } else {
              // Update image z-indices and behind/front status
              const behindCharacter = index < characterIndex
              const imageZIndex = behindCharacter
                ? index + 1 // z-index 1-4 for behind
                : index - characterIndex + 6 // z-index 6+ for front

              // Find and update the corresponding placed image
              const imageIndex = state.placedImages.findIndex(
                (img) => img.id === item.id
              )
              if (imageIndex !== -1) {
                state.placedImages[imageIndex].zIndex = imageZIndex
                state.placedImages[imageIndex].behindCharacter = behindCharacter
              }
            }
          })

          return { placedImages: [...state.placedImages] }
        })
      },

      clearPlacedImages: () => set({ placedImages: [] }),
    }),
    {
      name: 'aituber-kit-images',
      partialize: (state) => ({
        placedImages: state.placedImages,
        // Don't persist uploadedImages as they should be fetched fresh from API
      }),
    }
  )
)

export default useImagesStore
