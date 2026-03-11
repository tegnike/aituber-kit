import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import {
  isRestrictedMode,
  createRestrictedModeErrorResponse,
} from '@/utils/restrictedMode'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (isRestrictedMode()) {
    return res
      .status(403)
      .json(createRestrictedModeErrorResponse('update-pose-rotation'))
  }

  const { jsonPath, angleDeg } = req.body
  if (typeof jsonPath !== 'string' || typeof angleDeg !== 'number') {
    return res.status(400).json({ error: 'Invalid parameters' })
  }

  if (!jsonPath.endsWith('.json')) {
    return res.status(400).json({ error: 'Only .json files are allowed' })
  }

  const publicDir = path.normalize(path.join(process.cwd(), 'public'))
  const filePath = path.normalize(path.join(publicDir, jsonPath))

  if (!filePath.startsWith(publicDir + path.sep)) {
    return res.status(403).json({ error: 'Access denied' })
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const json = JSON.parse(content)
    json.yRotationOffsetDeg = angleDeg
    await fs.writeFile(filePath, JSON.stringify(json, null, 2))
    return res.status(200).json({ message: 'Pose rotation updated' })
  } catch (e) {
    console.error('Failed to update pose rotation:', e)
    return res.status(500).json({ error: 'Failed to update file' })
  }
}
