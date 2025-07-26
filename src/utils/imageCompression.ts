import { IMAGE_CONSTANTS } from '@/constants/images'

export const compressImageFile = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Skip compression for small files or GIFs
    if (
      file.size < IMAGE_CONSTANTS.COMPRESSION.LARGE_FILE_THRESHOLD ||
      file.type === 'image/gif'
    ) {
      resolve(file)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      const { MAX_WIDTH, MAX_HEIGHT, QUALITY } = IMAGE_CONSTANTS.COMPRESSION

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          // Create new file with compressed data
          const compressedFile = new File([blob], file.name, {
            type: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            lastModified: Date.now(),
          })

          resolve(compressedFile)
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        QUALITY
      )
    }

    img.onerror = () =>
      reject(new Error('Failed to load image for compression'))
    img.src = URL.createObjectURL(file)
  })
}
