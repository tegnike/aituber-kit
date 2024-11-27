import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = formidable({})

  try {
    const [fields, files] = await form.parse(req)
    const file = files.file?.[0]

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const vrmDir = path.join(process.cwd(), 'public/vrm')
    if (!fs.existsSync(vrmDir)) {
      fs.mkdirSync(vrmDir, { recursive: true })
    }

    const newPath = path.join(vrmDir, file.originalFilename || 'uploaded.vrm')
    await fs.promises.copyFile(file.filepath, newPath)

    res.status(200).json({
      path: `/vrm/${file.originalFilename}`,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload file' })
  }
}
