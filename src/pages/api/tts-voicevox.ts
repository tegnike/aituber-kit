import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type Data = {
  audio?: ArrayBuffer
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { text, speaker, speed, pitch, intonation, serverUrl } = req.body
  const apiUrl =
    serverUrl || process.env.VOICEVOX_SERVER_URL || 'http://localhost:50021'

  try {
    // 1. Audio Query の生成
    const queryResponse = await axios.post(
      `${apiUrl}/audio_query?speaker=${speaker}&text=${encodeURIComponent(text)}`,
      null,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    )

    const queryData = queryResponse.data
    queryData.speedScale = speed
    queryData.pitchScale = pitch
    queryData.intonationScale = intonation

    // 2. 音声合成
    const synthesisResponse = await axios.post(
      `${apiUrl}/synthesis?speaker=${speaker}`,
      queryData,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/wav',
        },
        responseType: 'stream',
        timeout: 30000,
      }
    )

    res.setHeader('Content-Type', 'audio/wav')
    synthesisResponse.data.pipe(res)
  } catch (error) {
    console.error('Error in VOICEVOX TTS:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
