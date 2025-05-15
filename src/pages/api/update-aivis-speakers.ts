import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'

interface Style {
  name: string
  id: number
  type: string
}

interface Speaker {
  name: string
  speaker_uuid: string
  styles: Style[]
}

interface AivisSpeaker {
  speaker: string
  id: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // APIからデータを取得
    const serverUrl =
      req.query.serverUrl ||
      process.env.AIVIS_SPEECH_SERVER_URL ||
      'http://127.0.0.1:10101'
    const response = await fetch(`${serverUrl}/speakers`)
    const speakers: Speaker[] = await response.json()

    // Aivis形式に変換
    const aivisSpeakers: AivisSpeaker[] = speakers.flatMap((speaker) =>
      speaker.styles.map((style) => ({
        speaker: `${speaker.name}/${style.name}`,
        id: style.id,
      }))
    )

    // JSONファイルに書き込み
    const filePath = path.join(process.cwd(), 'public/speakers_aivis.json')
    await fs.writeFile(filePath, JSON.stringify(aivisSpeakers, null, 2) + '\n')

    res.status(200).json({ message: 'Speakers file updated successfully' })
  } catch (error) {
    console.error('Error updating speakers:', error)
    res.status(500).json({ error: 'Failed to update speakers file' })
  }
}
