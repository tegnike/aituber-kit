import useImagesStore from '@/features/stores/images'
import { IMAGE_CONSTANTS } from '@/constants/images'

// Mock zustand and zustand/middleware
jest.mock('zustand', () => ({
  create: jest.fn(() => (stateCreator: any) => {
    let state: any
    const setState = jest.fn((updater: any) => {
      if (typeof updater === 'function') {
        state = { ...state, ...updater(state) }
      } else {
        state = { ...state, ...updater }
      }
    })
    const getState = jest.fn(() => state)
    const api = { setState, getState, subscribe: jest.fn(), destroy: jest.fn() }

    // Handle persist wrapper
    if (typeof stateCreator === 'function') {
      state = stateCreator(setState, getState, api)
    } else {
      state = stateCreator
    }

    return Object.assign(
      jest.fn(() => state),
      {
        getState: () => state,
        setState,
        subscribe: jest.fn(),
        destroy: jest.fn(),
      }
    )
  }),
}))

jest.mock('zustand/middleware', () => ({
  persist: jest.fn((stateCreator: any) => stateCreator),
}))

describe.skip('Images Store', () => {
  let store: any

  beforeEach(() => {
    // Reset store state
    store = useImagesStore.getState()
    if (store) {
      store.placedImages = []
      store.uploadedImages = []
    }
  })

  describe('addPlacedImage', () => {
    it('should add a new placed image', () => {
      const filename = 'test.jpg'
      const path = '/images/uploaded/test.jpg'

      store.addPlacedImage(filename, path)

      expect(store.placedImages).toHaveLength(1)
      expect(store.placedImages[0]).toMatchObject({
        filename,
        path,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 200 },
        behindCharacter: false,
      })
    })

    it('should assign correct z-index when adding images', () => {
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')

      // First image should be in front of character (z-index > 5)
      expect(store.placedImages[0].zIndex).toBe(6)
      expect(store.placedImages[1].zIndex).toBe(7)
    })
  })

  describe('removePlacedImage', () => {
    it('should remove placed image by id', () => {
      store.addPlacedImage('test.jpg', '/images/test.jpg')
      const imageId = store.placedImages[0].id

      store.removePlacedImage(imageId)

      expect(store.placedImages).toHaveLength(0)
    })
  })

  describe('updateImageLayerPosition', () => {
    it('should update image layer position', () => {
      store.addPlacedImage('test.jpg', '/images/test.jpg')
      const imageId = store.placedImages[0].id
      const initialZIndex = store.placedImages[0].zIndex

      store.updateImageLayerPosition(imageId, true) // Move behind character

      const updatedImage = store.placedImages.find((img) => img.id === imageId)
      expect(updatedImage?.behindCharacter).toBe(true)
      expect(updatedImage?.zIndex).toBeLessThan(
        IMAGE_CONSTANTS.CHARACTER_Z_INDEX
      )
    })
  })

  describe('reorderAllLayers', () => {
    it('should reorder layers correctly', () => {
      // Add multiple images
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')
      store.addPlacedImage('test3.jpg', '/images/test3.jpg')

      const initialOrder = store.placedImages.map((img) => img.filename)

      // Move first item to last position
      store.reorderAllLayers(0, 2)

      const newOrder = store
        .getAllLayerItems()
        .map((item) => (item.type === 'image' ? item.filename : 'character'))

      expect(newOrder).not.toEqual(initialOrder)
    })
  })

  describe('getAllLayerItems', () => {
    it('should return correct layer items with character', () => {
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')

      const layerItems = store.getAllLayerItems()

      expect(layerItems).toHaveLength(3) // 2 images + character
      expect(layerItems.some((item) => item.type === 'character')).toBe(true)
      expect(layerItems.filter((item) => item.type === 'image')).toHaveLength(2)
    })

    it('should sort layers by z-index', () => {
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')

      // Move one image behind character
      const firstImageId = store.placedImages[0].id
      store.updateImageLayerPosition(firstImageId, true)

      const layerItems = store.getAllLayerItems()
      const zIndexes = layerItems.map((item) => item.zIndex)

      // Should be sorted in ascending order
      for (let i = 1; i < zIndexes.length; i++) {
        expect(zIndexes[i]).toBeGreaterThan(zIndexes[i - 1])
      }
    })
  })

  describe('addUploadedImage', () => {
    it('should add uploaded image to the list', () => {
      const uploadedImage = {
        filename: 'test.jpg',
        path: '/images/uploaded/test.jpg',
        uploadedAt: new Date(),
      }

      store.addUploadedImage(uploadedImage)

      expect(store.uploadedImages).toHaveLength(1)
      expect(store.uploadedImages[0]).toEqual(uploadedImage)
    })
  })

  describe('removeUploadedImage', () => {
    it('should remove uploaded image by filename', () => {
      const uploadedImage = {
        filename: 'test.jpg',
        path: '/images/uploaded/test.jpg',
        uploadedAt: new Date(),
      }

      store.addUploadedImage(uploadedImage)
      store.removeUploadedImage('test.jpg')

      expect(store.uploadedImages).toHaveLength(0)
    })
  })
})
