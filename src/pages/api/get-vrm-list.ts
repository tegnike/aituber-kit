import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const vrmDir = path.join(process.cwd(), 'public/vrm')

  try {
    if (!fs.existsSync(vrmDir)) {
      return res.status(404).json({ error: 'VRM directory not found' })
    }
    const files = await fs.promises.readdir(vrmDir)
    const vrmFiles = files.filter((file) => file.endsWith('.vrm'))
    res.status(200).json(vrmFiles)
  } catch (error) {
    console.error('Error reading VRM directory:', error)
    res.status(500).json({
      error: 'Failed to get VRM file list',
    })
  }
}
