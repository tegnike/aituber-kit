import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { isRestrictedMode } from '@/utils/restrictedMode'
import assetManifest from '@/constants/assetManifest.json'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (isRestrictedMode()) {
    return res.status(200).json(assetManifest.vrm)
  }

  const vrmDir = path.join(process.cwd(), 'public/vrm')

  try {
    if (!fs.existsSync(vrmDir)) {
      return res.status(200).json([])
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
