import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import { isRestrictedMode } from '@/utils/restrictedMode'
import assetManifest from '@/constants/assetManifest.json'

interface PoseListItem {
  name: string
  path: string
}

const manifest = assetManifest as Record<string, unknown>

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (isRestrictedMode()) {
    return res.status(200).json(manifest.poses ?? [])
  }

  const posesDir = path.join(process.cwd(), 'public', 'poses')

  try {
    const files = await fs.promises.readdir(posesDir)
    const jsonFiles = files.filter((file) => file.endsWith('.json'))

    const poseFiles: PoseListItem[] = []

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(posesDir, file)
        const content = await fs.promises.readFile(filePath, 'utf-8')
        const json = JSON.parse(content)

        if ((json.specVersion && json.bones) || (json.version && json.pose)) {
          poseFiles.push({
            name: file.replace('.json', ''),
            path: `/poses/${file}`,
          })
        }
      } catch (error) {
        console.warn(`Skip invalid pose JSON: ${file}`, error)
      }
    }

    res.status(200).json(poseFiles)
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return res.status(200).json([])
    }
    console.error('Error reading pose files:', error)
    res.status(500).json({ error: 'Failed to get pose file list' })
  }
}
