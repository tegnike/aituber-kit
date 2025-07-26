/**
 * @jest-environment jsdom
 */

import { compressImageFile } from '@/utils/imageCompression'
import { IMAGE_CONSTANTS } from '@/constants/images'

// Mock HTML5 Canvas and Image APIs
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
  })),
  toBlob: jest.fn(),
}

const mockImage = {
  onload: null as ((event: Event) => void) | null,
  onerror: null as ((event: Event) => void) | null,
  src: '',
  width: 800,
  height: 600,
}

// Mock DOM methods
global.HTMLCanvasElement = jest.fn(() => mockCanvas) as any
global.Image = jest.fn(() => mockImage) as any
global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
} as any

describe('imageCompression', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanvas.toBlob = jest.fn()
    mockImage.onload = null
    mockImage.onerror = null
  })

  it('should return original file if size is below threshold', async () => {
    const smallFile = new File(['small content'], 'small.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    // Mock file size to be below threshold
    Object.defineProperty(smallFile, 'size', {
      value: IMAGE_CONSTANTS.COMPRESSION.LARGE_FILE_THRESHOLD - 1,
      writable: false,
    })

    const result = await compressImageFile(smallFile)
    expect(result).toBe(smallFile)
  })

  it('should return original file for GIF images', async () => {
    const gifFile = new File(['gif content'], 'animated.gif', {
      type: 'image/gif',
      lastModified: Date.now(),
    })

    // Mock file size to be above threshold
    Object.defineProperty(gifFile, 'size', {
      value: IMAGE_CONSTANTS.COMPRESSION.LARGE_FILE_THRESHOLD + 1,
      writable: false,
    })

    const result = await compressImageFile(gifFile)
    expect(result).toBe(gifFile)
  })

  it('should compress large image files', async () => {
    const largeFile = new File(['large image content'], 'large.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    // Mock file size to be above threshold
    Object.defineProperty(largeFile, 'size', {
      value: IMAGE_CONSTANTS.COMPRESSION.LARGE_FILE_THRESHOLD + 1,
      writable: false,
    })

    const mockBlob = new Blob(['compressed'], { type: 'image/jpeg' })
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback(mockBlob)
    })

    const compressionPromise = compressImageFile(largeFile)

    // Simulate image loading
    if (mockImage.onload) {
      mockImage.onload({} as Event)
    }

    const result = await compressionPromise

    expect(result).toBeInstanceOf(File)
    expect(result.name).toBe('large.jpg')
    expect(result.type).toBe('image/jpeg')
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
    expect(mockCanvas.toBlob).toHaveBeenCalled()
  })

  it('should handle compression errors gracefully', async () => {
    const largeFile = new File(['large image content'], 'large.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    Object.defineProperty(largeFile, 'size', {
      value: IMAGE_CONSTANTS.COMPRESSION.LARGE_FILE_THRESHOLD + 1,
      writable: false,
    })

    const compressionPromise = compressImageFile(largeFile)

    // Simulate image loading error
    if (mockImage.onerror) {
      mockImage.onerror({} as Event)
    }

    await expect(compressionPromise).rejects.toThrow(
      'Failed to load image for compression'
    )
  })

  it('should handle canvas blob creation failure', async () => {
    const largeFile = new File(['large image content'], 'large.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    Object.defineProperty(largeFile, 'size', {
      value: IMAGE_CONSTANTS.COMPRESSION.LARGE_FILE_THRESHOLD + 1,
      writable: false,
    })

    // Mock toBlob to return null (failure case)
    mockCanvas.toBlob.mockImplementation((callback) => {
      callback(null)
    })

    const compressionPromise = compressImageFile(largeFile)

    // Simulate image loading
    if (mockImage.onload) {
      mockImage.onload({} as Event)
    }

    await expect(compressionPromise).rejects.toThrow('Failed to compress image')
  })
})
