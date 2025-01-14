import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type Data = {
  audio?: Buffer
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { script, speed, voiceActorId, apiKey, emotionalLevel, soundDuration } =
    req.body

  const nijivoiceApiKey = apiKey || process.env.NIJIVOICE_API_KEY
  if (!nijivoiceApiKey) {
    return res.status(400).json({ error: 'API key is required' })
  }

  try {
    const response = await axios.post(
      `https://api.nijivoice.com/api/platform/v1/voice-actors/${voiceActorId}/generate-encoded-voice`,
      {
        script,
        speed: speed.toString(),
        format: 'mp3',
        emotionalLevel: emotionalLevel.toString(),
        soundDuration: soundDuration.toString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': nijivoiceApiKey,
        },
        timeout: 30000,
      }
    )

    const base64Audio = response.data.generatedVoice.base64Audio
    const audioBuffer = Buffer.from(base64Audio, 'base64')

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    })
    res.end(audioBuffer)
  } catch (error) {
    console.error('Error in Nijivoice TTS:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
