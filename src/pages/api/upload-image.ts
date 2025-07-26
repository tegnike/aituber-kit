import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { IMAGE_CONSTANTS } from '@/constants/images'

export const config = {
  api: {
    bodyParser: false,
  },
}

const formOptions: formidable.Options = {
  maxFileSize: IMAGE_CONSTANTS.MAX_FILE_SIZE,
  filter: (part) => {
    return part.mimetype?.startsWith('image/') || false
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = formidable(formOptions)

  try {
    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const extension = path.extname(file.originalFilename || '').toLowerCase()

    if (!IMAGE_CONSTANTS.VALID_EXTENSIONS.includes(extension as any)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPG, PNG, GIF and WebP images can be uploaded',
      })
    }

    // Additional MIME type validation for security
    if (!IMAGE_CONSTANTS.VALID_MIME_TYPES.includes(file.mimetype as any)) {
      return res.status(400).json({
        error: 'Invalid MIME type',
        message: 'File content does not match allowed image types',
      })
    }

    const imagesDir = path.join(process.cwd(), IMAGE_CONSTANTS.UPLOAD_DIRECTORY)
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    const timestamp = Date.now()

    // Sanitize filename to prevent path traversal attacks
    const sanitizedOriginalName = (file.originalFilename || 'image')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.+/g, '.')
      .substring(0, IMAGE_CONSTANTS.MAX_FILENAME_LENGTH)

    const filename = `${timestamp}_${sanitizedOriginalName}${extension}`
    const newPath = path.join(imagesDir, filename)

    // Ensure the resolved path is within the images directory
    const normalizedNewPath = path.normalize(newPath)
    const normalizedImagesDir = path.normalize(imagesDir)

    if (!normalizedNewPath.startsWith(normalizedImagesDir)) {
      return res.status(403).json({ error: 'Access denied: Invalid file path' })
    }

    await fs.promises.copyFile(file.filepath, newPath)

    res.status(200).json({
      path: `/images/uploaded/${filename}`,
      filename,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' })
  }
}
