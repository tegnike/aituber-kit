import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const vrmDir = path.join(process.cwd(), 'public/vrm')

  try {
    const files = fs.readdirSync(vrmDir)
    const vrmFiles = files.filter((file) => file.endsWith('.vrm'))
    res.status(200).json(vrmFiles)
  } catch (error) {
    res.status(500).json({ error: 'Failed to read VRM directory' })
  }
}
