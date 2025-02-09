import fs from 'fs'
import path from 'path'
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const slidesDir = path.join(process.cwd(), 'public', 'slides')

  try {
    const folders = fs
      .readdirSync(slidesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)

    res.status(200).json(folders)
  } catch (error) {
    console.error('Error reading slides directory:', error)
    res.status(500).json({ error: 'Unable to read slides directory' })
  }
}
