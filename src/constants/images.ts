export const IMAGE_CONSTANTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_PLACED_IMAGES: 5,
  CHARACTER_Z_INDEX: 5,
  MAX_FILENAME_LENGTH: 50,
  VALID_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] as const,
  VALID_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ] as const,
  UPLOAD_DIRECTORY: 'public/images/uploaded',
  TOAST_DURATION: {
    SHORT: 3000,
    LONG: 5000,
  },
  COMPRESSION: {
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
    QUALITY: 0.8,
    LARGE_FILE_THRESHOLD: 5 * 1024 * 1024, // 5MB
  },
  DEBOUNCE_DELAY: 100, // ms for position/size updates
  RESIZE_HANDLE: {
    SIZE: 16, // 4x4 in pixels (w-4 h-4)
    OFFSET: -8, // -2 in pixels (-top-2, -left-2)
  },
  DIMENSIONS: {
    MIN_WIDTH: 50,
    MIN_HEIGHT: 50,
    MAX_WIDTH: 1920,
    MAX_HEIGHT: 1080,
  },
} as const
