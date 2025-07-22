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
}

interface ImagesState {
  uploadedImages: UploadedImage[]
  placedImages: PlacedImage[]
  
  // Actions
  setUploadedImages: (images: UploadedImage[]) => void
  addUploadedImage: (image: UploadedImage) => void
  addPlacedImage: (filename: string, path: string) => void
  removePlacedImage: (id: string) => void
  updatePlacedImagePosition: (id: string, position: { x: number; y: number }) => void
  updatePlacedImageSize: (id: string, size: { width: number; height: number }) => void
  updatePlacedImageZIndex: (id: string, zIndex: number) => void
  clearPlacedImages: () => void
}

const useImagesStore = create<ImagesState>()(
  persist(
    (set, get) => ({
      uploadedImages: [],
      placedImages: [],

      setUploadedImages: (images) => set({ uploadedImages: images }),
      
      addUploadedImage: (image) => set((state) => ({
        uploadedImages: [image, ...state.uploadedImages]
      })),

      addPlacedImage: (filename, path) => {
        const { placedImages } = get()
        
        // Check if we already have 5 images placed
        if (placedImages.length >= 5) {
          return
        }

        // Check if this image is already placed
        if (placedImages.some(img => img.filename === filename)) {
          return
        }

        const newImage: PlacedImage = {
          id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        }

        set((state) => ({
          placedImages: [...state.placedImages, newImage]
        }))
      },

      removePlacedImage: (id) => set((state) => ({
        placedImages: state.placedImages.filter(img => img.id !== id)
      })),

      updatePlacedImagePosition: (id, position) => set((state) => ({
        placedImages: state.placedImages.map(img =>
          img.id === id ? { ...img, position } : img
        )
      })),

      updatePlacedImageSize: (id, size) => set((state) => ({
        placedImages: state.placedImages.map(img =>
          img.id === id ? { ...img, size } : img
        )
      })),

      updatePlacedImageZIndex: (id, zIndex) => set((state) => ({
        placedImages: state.placedImages.map(img =>
          img.id === id ? { ...img, zIndex } : img
        )
      })),

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