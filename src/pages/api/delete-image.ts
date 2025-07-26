import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { filename } = req.body

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' })
  }

  try {
    const imagesDir = path.join(process.cwd(), 'public/images/uploaded')
    const filePath = path.join(imagesDir, filename)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Security check: ensure the file is within the uploaded directory
    const normalizedFilePath = path.normalize(filePath)
    const normalizedImagesDir = path.normalize(imagesDir)

    if (!normalizedFilePath.startsWith(normalizedImagesDir)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Delete the file
    await fs.promises.unlink(filePath)

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      filename,
    })
  } catch (error) {
    console.error('Failed to delete file:', error)
    res.status(500).json({ error: 'Failed to delete file' })
  }
}
