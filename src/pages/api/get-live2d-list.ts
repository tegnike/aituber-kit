import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

interface Live2DModelInfo {
  path: string
  name: string
  expressions: string[]
  motions: string[]
}

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
    const live2dModels: Live2DModelInfo[] = []

    for (const folder of folders) {
      if (folder.isDirectory()) {
        const folderPath = path.join(live2dDir, folder.name)
        const files = await fs.promises.readdir(folderPath)
        const model3File = files.find((file) => file.endsWith('.model3.json'))

        if (model3File) {
          const modelPath = `/live2d/${folder.name}/${model3File}`
          const fullPath = path.join(folderPath, model3File)
          const modelContent = await fs.promises.readFile(fullPath, 'utf-8')
          const modelJson = JSON.parse(modelContent)

          // Extract expressions and motions from model3.json
          const expressions =
            modelJson.FileReferences.Expressions?.map(
              (exp: { Name: string }) => exp.Name
            ) || []
          const motions = Object.keys(modelJson.FileReferences.Motions || {})

          live2dModels.push({
            path: modelPath,
            name: folder.name,
            expressions,
            motions,
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
