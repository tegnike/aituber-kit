import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import {
  isRestrictedMode,
  createRestrictedModeErrorResponse,
} from '@/utils/restrictedMode'

export const config = {
  api: {
    bodyParser: false,
  },
}
const ACCEPTED_EXTENSIONS = ['.vrm', '.vrca', '.zip', '.glb', '.gltf']

const formOptions = {
  maxFileSize: 300 * 1024 * 1024,
}

const sanitizeFilename = (filename: string): string =>
  filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .slice(0, 180)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (isRestrictedMode()) {
    return res
      .status(403)
      .json(createRestrictedModeErrorResponse('upload-vrchat-model'))
  }

  const form = formidable(formOptions)

  try {
    const [, files] = await form.parse(req)
    const file = files.file?.[0]

    if (!file || !file.originalFilename) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const originalName = sanitizeFilename(file.originalFilename)
    const extension = path.extname(originalName).toLowerCase()
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: `Allowed: ${ACCEPTED_EXTENSIONS.join(', ')}`,
      })
    }

    const modelDir = path.join(process.cwd(), 'public/vrchat-models')
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true })
    }

    const finalName = `${Date.now()}_${originalName}`
    const finalPath = path.join(modelDir, finalName)
    await fs.promises.copyFile(file.filepath, finalPath)

    return res.status(200).json({
      path: `/vrchat-models/${finalName}`,
      filename: finalName,
    })
  } catch (error) {
    console.error('Failed to upload VRChat model:', error)
    return res.status(500).json({ error: 'Failed to upload file' })
  }
}
