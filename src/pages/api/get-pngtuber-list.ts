import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

interface PNGTuberModelInfo {
  path: string
  name: string
  videoFile: string
  mouthTrack: string
  mouthSprites: {
    closed: string
    open: string
    half?: string
    e?: string
    u?: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const pngtuberDir = path.join(process.cwd(), 'public/pngtuber')

  try {
    if (!fs.existsSync(pngtuberDir)) {
      // ディレクトリが存在しない場合は空配列を返す
      return res.status(200).json([])
    }

    const folders = await fs.promises.readdir(pngtuberDir, {
      withFileTypes: true,
    })
    const pngtuberModels: PNGTuberModelInfo[] = []

    for (const folder of folders) {
      if (!folder.isDirectory()) continue

      const folderPath = path.join(pngtuberDir, folder.name)
      const files = await fs.promises.readdir(folderPath)

      // *_mouthless_h264.mp4 を優先、なければ *_mouthless*.mp4 を検索
      const videoFile =
        files.find(
          (f) =>
            f.toLowerCase().includes('mouthless') &&
            f.toLowerCase().includes('h264') &&
            f.toLowerCase().endsWith('.mp4')
        ) ||
        files.find(
          (f) =>
            f.toLowerCase().includes('mouthless') &&
            f.toLowerCase().endsWith('.mp4')
        )

      // mouth_track.json を検索
      const mouthTrackFile = files.find(
        (f) => f.toLowerCase() === 'mouth_track.json'
      )

      // mouth/ ディレクトリを確認
      const mouthDir = path.join(folderPath, 'mouth')
      if (!fs.existsSync(mouthDir)) continue

      const mouthFiles = await fs.promises.readdir(mouthDir)

      // 必須スプライト: closed.png, open.png
      const closedSprite = mouthFiles.find(
        (f) => f.toLowerCase() === 'closed.png'
      )
      const openSprite = mouthFiles.find((f) => f.toLowerCase() === 'open.png')

      // 必須ファイルが揃っているか確認
      if (!videoFile || !mouthTrackFile || !closedSprite || !openSprite) {
        continue
      }

      // オプショナルスプライト
      const halfSprite = mouthFiles.find((f) => f.toLowerCase() === 'half.png')
      const eSprite = mouthFiles.find((f) => f.toLowerCase() === 'e.png')
      const uSprite = mouthFiles.find((f) => f.toLowerCase() === 'u.png')

      pngtuberModels.push({
        path: `/pngtuber/${folder.name}`,
        name: folder.name,
        videoFile,
        mouthTrack: mouthTrackFile,
        mouthSprites: {
          closed: closedSprite,
          open: openSprite,
          ...(halfSprite && { half: halfSprite }),
          ...(eSprite && { e: eSprite }),
          ...(uSprite && { u: uSprite }),
        },
      })
    }

    res.status(200).json(pngtuberModels)
  } catch (error) {
    console.error('Error reading PNGTuber directory:', error)
    res.status(500).json({
      error: 'Failed to get PNGTuber model list',
    })
  }
}
