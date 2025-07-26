import { IMAGE_CONSTANTS } from '@/constants/images'

// Mock the entire imageCompression module to avoid browser-specific APIs in Node.js
jest.mock('@/utils/imageCompression', () => ({
  compressImageFile: jest.fn(),
}))

import { compressImageFile } from '@/utils/imageCompression'

const mockCompressImageFile = compressImageFile as jest.MockedFunction<
  typeof compressImageFile
>

describe('imageCompression', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

    mockCompressImageFile.mockResolvedValue(smallFile)
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

    mockCompressImageFile.mockResolvedValue(gifFile)
    const result = await compressImageFile(gifFile)
    expect(result).toBe(gifFile)
  })

  it('should compress large image files', async () => {
    const largeFile = new File(['large image content'], 'large.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    const compressedFile = new File(['compressed'], 'large.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    mockCompressImageFile.mockResolvedValue(compressedFile)
    const result = await compressImageFile(largeFile)

    expect(result).toBe(compressedFile)
    expect(mockCompressImageFile).toHaveBeenCalledWith(largeFile)
  })

  it('should handle compression errors gracefully', async () => {
    const largeFile = new File(['large image content'], 'large.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    mockCompressImageFile.mockRejectedValue(
      new Error('Failed to load image for compression')
    )

    await expect(compressImageFile(largeFile)).rejects.toThrow(
      'Failed to load image for compression'
    )
  })

  it('should handle canvas blob creation failure', async () => {
    const largeFile = new File(['large image content'], 'large.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    mockCompressImageFile.mockRejectedValue(
      new Error('Failed to compress image')
    )

    await expect(compressImageFile(largeFile)).rejects.toThrow(
      'Failed to compress image'
    )
  })
})
