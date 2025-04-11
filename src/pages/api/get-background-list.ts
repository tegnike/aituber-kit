import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const backgroundsDir = path.join(process.cwd(), 'public/backgrounds')

    if (!fs.existsSync(backgroundsDir)) {
      fs.mkdirSync(backgroundsDir, { recursive: true })
      return res.status(200).json([])
    }

    const files = fs.readdirSync(backgroundsDir)
    const imageFiles = files.filter((file) => {
      const extension = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)
    })

    res.status(200).json(imageFiles)
  } catch (error) {
    console.error('Error fetching background list:', error)
    res.status(500).json({ error: 'Failed to fetch background list' })
  }
}
