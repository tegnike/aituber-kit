/**
 * @jest-environment node
 */
import useImagesStore from '@/features/stores/images'
import { IMAGE_CONSTANTS } from '@/constants/images'

describe('Images Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useImagesStore.getState()
    store.clearPlacedImages()
    store.setUploadedImages([])
  })

  describe('addPlacedImage', () => {
    it('should add a new placed image', () => {
      const store = useImagesStore.getState()
      const filename = 'test.jpg'
      const path = '/images/uploaded/test.jpg'

      store.addPlacedImage(filename, path)

      const { placedImages } = useImagesStore.getState()
      expect(placedImages).toHaveLength(1)
      expect(placedImages[0]).toMatchObject({
        filename,
        path,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 150 },
        behindCharacter: false,
      })
    })

    it('should assign correct z-index when adding images', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')

      const { placedImages } = useImagesStore.getState()
      // z-index starts from 0 and increments
      expect(placedImages[0].zIndex).toBe(0)
      expect(placedImages[1].zIndex).toBe(1)
    })

    it('should not add more than 5 images', () => {
      const store = useImagesStore.getState()
      for (let i = 0; i < 6; i++) {
        store.addPlacedImage(`test${i}.jpg`, `/images/test${i}.jpg`)
      }

      const { placedImages } = useImagesStore.getState()
      expect(placedImages).toHaveLength(5)
    })

    it('should not add duplicate images', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test.jpg', '/images/test.jpg')
      store.addPlacedImage('test.jpg', '/images/test.jpg')

      const { placedImages } = useImagesStore.getState()
      expect(placedImages).toHaveLength(1)
    })
  })

  describe('removePlacedImage', () => {
    it('should remove placed image by id', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test.jpg', '/images/test.jpg')
      const { placedImages } = useImagesStore.getState()
      const imageId = placedImages[0].id

      store.removePlacedImage(imageId)

      expect(useImagesStore.getState().placedImages).toHaveLength(0)
    })
  })

  describe('updateImageLayerPosition', () => {
    it('should update image layer position', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test.jpg', '/images/test.jpg')
      const { placedImages } = useImagesStore.getState()
      const imageId = placedImages[0].id

      store.updateImageLayerPosition(imageId, true) // Move behind character

      const updatedState = useImagesStore.getState()
      const updatedImage = updatedState.placedImages.find(
        (img) => img.id === imageId
      )
      expect(updatedImage?.behindCharacter).toBe(true)
      expect(updatedImage?.zIndex).toBeLessThan(
        IMAGE_CONSTANTS.CHARACTER_Z_INDEX
      )
    })
  })

  describe('reorderAllLayers', () => {
    it('should reorder layers correctly', () => {
      const store = useImagesStore.getState()
      // Add multiple images
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')
      store.addPlacedImage('test3.jpg', '/images/test3.jpg')

      const initialOrder = useImagesStore
        .getState()
        .placedImages.map((img) => img.filename)

      // Move first item to last position
      store.reorderAllLayers(0, 2)

      const newOrder = useImagesStore
        .getState()
        .getAllLayerItems()
        .map((item) => (item.type === 'image' ? item.filename : 'character'))

      expect(newOrder).not.toEqual(initialOrder)
    })
  })

  describe('getAllLayerItems', () => {
    it('should return correct layer items with character', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')

      const layerItems = useImagesStore.getState().getAllLayerItems()

      expect(layerItems).toHaveLength(3) // 2 images + character
      expect(layerItems.some((item) => item.type === 'character')).toBe(true)
      expect(layerItems.filter((item) => item.type === 'image')).toHaveLength(2)
    })

    it('should sort layers by z-index', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')

      // Move one image behind character
      const { placedImages } = useImagesStore.getState()
      const firstImageId = placedImages[0].id
      store.updateImageLayerPosition(firstImageId, true)

      const layerItems = useImagesStore.getState().getAllLayerItems()
      const zIndexes = layerItems.map((item) => item.zIndex)

      // Should be sorted in ascending order
      for (let i = 1; i < zIndexes.length; i++) {
        expect(zIndexes[i]).toBeGreaterThanOrEqual(zIndexes[i - 1])
      }
    })
  })

  describe('addUploadedImage', () => {
    it('should add uploaded image to the list', () => {
      const store = useImagesStore.getState()
      const uploadedImage = {
        filename: 'test.jpg',
        path: '/images/uploaded/test.jpg',
        uploadedAt: new Date(),
      }

      store.addUploadedImage(uploadedImage)

      const { uploadedImages } = useImagesStore.getState()
      expect(uploadedImages).toHaveLength(1)
      expect(uploadedImages[0]).toEqual(uploadedImage)
    })
  })

  describe('removeUploadedImage', () => {
    it('should remove uploaded image by filename', () => {
      const store = useImagesStore.getState()
      const uploadedImage = {
        filename: 'test.jpg',
        path: '/images/uploaded/test.jpg',
        uploadedAt: new Date(),
      }

      store.addUploadedImage(uploadedImage)
      store.removeUploadedImage('test.jpg')

      expect(useImagesStore.getState().uploadedImages).toHaveLength(0)
    })
  })

  describe('updatePlacedImagePosition', () => {
    it('should update image position', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test.jpg', '/images/test.jpg')
      const { placedImages } = useImagesStore.getState()
      const imageId = placedImages[0].id

      store.updatePlacedImagePosition(imageId, { x: 200, y: 300 })

      const updatedImage = useImagesStore
        .getState()
        .placedImages.find((img) => img.id === imageId)
      expect(updatedImage?.position).toEqual({ x: 200, y: 300 })
    })
  })

  describe('updatePlacedImageSize', () => {
    it('should update image size', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test.jpg', '/images/test.jpg')
      const { placedImages } = useImagesStore.getState()
      const imageId = placedImages[0].id

      store.updatePlacedImageSize(imageId, { width: 400, height: 300 })

      const updatedImage = useImagesStore
        .getState()
        .placedImages.find((img) => img.id === imageId)
      expect(updatedImage?.size).toEqual({ width: 400, height: 300 })
    })
  })

  describe('clearPlacedImages', () => {
    it('should clear all placed images', () => {
      const store = useImagesStore.getState()
      store.addPlacedImage('test1.jpg', '/images/test1.jpg')
      store.addPlacedImage('test2.jpg', '/images/test2.jpg')

      store.clearPlacedImages()

      expect(useImagesStore.getState().placedImages).toHaveLength(0)
    })
  })
})
