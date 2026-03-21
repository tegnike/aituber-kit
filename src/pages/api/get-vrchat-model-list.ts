import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { isRestrictedMode } from '@/utils/restrictedMode'

const ACCEPTED_EXTENSIONS = new Set(['.vrm', '.vrca', '.zip', '.glb', '.gltf'])

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (isRestrictedMode()) {
    return res.status(200).json([])
  }

  const modelDir = path.join(process.cwd(), 'public/vrchat-models')
  try {
    if (!fs.existsSync(modelDir)) {
      return res.status(200).json([])
    }

    const files = await fs.promises.readdir(modelDir)
    const modelFiles = files.filter((file) =>
      ACCEPTED_EXTENSIONS.has(path.extname(file).toLowerCase())
    )
    return res.status(200).json(modelFiles)
  } catch (error) {
    console.error('Error reading VRChat model directory:', error)
    return res.status(500).json({
      error: 'Failed to get VRChat model file list',
    })
  }
}
