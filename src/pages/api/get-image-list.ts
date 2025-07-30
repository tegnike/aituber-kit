import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const imagesDir = path.join(process.cwd(), 'public/images/uploaded')

    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
      return res.status(200).json([])
    }

    const files = fs.readdirSync(imagesDir)
    const imageFiles = files
      .filter((file) => {
        const extension = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)
      })
      .map((filename) => ({
        filename,
        path: `/images/uploaded/${filename}`,
        uploadedAt: fs.statSync(path.join(imagesDir, filename)).mtime,
      }))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()) // Sort by upload date, newest first

    res.status(200).json(imageFiles)
  } catch (error) {
    console.error('Error fetching image list:', error)
    res.status(500).json({ error: 'Failed to fetch image list' })
  }
}
