import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}
const formOptions: formidable.Options = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
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

    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const extension = path.extname(file.originalFilename || '').toLowerCase()

    if (!validExtensions.includes(extension)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPG, PNG, GIF and WebP images can be uploaded',
      })
    }

    const bgDir = path.join(process.cwd(), 'public/backgrounds')
    if (!fs.existsSync(bgDir)) {
      fs.mkdirSync(bgDir, { recursive: true })
    }

    const newPath = path.join(
      bgDir,
      file.originalFilename || 'background' + extension
    )
    await fs.promises.copyFile(file.filepath, newPath)

    res.status(200).json({
      path: `/backgrounds/${file.originalFilename}`,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' })
  }
}
