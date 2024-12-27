import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const live2dDir = path.join(process.cwd(), 'public/live2d')

  try {
    if (!fs.existsSync(live2dDir)) {
      return res.status(404).json({ error: 'Live2D directory not found' })
    }

    const folders = await fs.promises.readdir(live2dDir, {
      withFileTypes: true,
    })
    const live2dModels = []

    for (const folder of folders) {
      if (folder.isDirectory()) {
        const folderPath = path.join(live2dDir, folder.name)
        const files = await fs.promises.readdir(folderPath)
        const model3File = files.find((file) => file.endsWith('.model3.json'))

        if (model3File) {
          live2dModels.push({
            path: `/live2d/${folder.name}/${model3File}`,
            name: folder.name,
          })
        }
      }
    }

    res.status(200).json(live2dModels)
  } catch (error) {
    console.error('Error reading Live2D directory:', error)
    res.status(500).json({
      error: 'Failed to get Live2D model list',
    })
  }
}
