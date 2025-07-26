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
} as const
