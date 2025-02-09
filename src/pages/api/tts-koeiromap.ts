import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type Data = {
  audio?: Uint8Array
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { message, speakerX, speakerY, style, apiKey } = req.body

  try {
    const response = await axios.post(
      'https://api.rinna.co.jp/koeiromap/v1.0/infer',
      {
        text: message,
        speaker_x: speakerX,
        speaker_y: speakerY,
        style: style,
        output_format: 'mp3',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': apiKey,
        },
      }
    )

    const audio = response.data.audio
    res.status(200).json({ audio })
  } catch (error) {
    console.error('Error in Koeiromap TTS:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
