import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

interface PoseListItem {
  name: string
  path: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

        if (json.specVersion && json.bones) {
          poseFiles.push({
            name: file.replace('.json', ''),
            path: `/poses/${file}`,
          })
        }
      } catch {
        // JSON解析エラーはスキップ
      }
    }

    res.status(200).json(poseFiles)
  } catch (error) {
    console.error('Error reading pose files:', error)
    res.status(500).json({ error: 'Failed to get pose file list' })
  }
}
