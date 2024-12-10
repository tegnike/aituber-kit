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
  const { script, speed, voiceActorId, apiKey } = req.body

  const nijivoiceApiKey = apiKey || process.env.NIJIVOICE_API_KEY
  if (!nijivoiceApiKey) {
    return res.status(400).json({ error: 'API key is required' })
  }

  try {
    const response = await axios.post(
      `https://api.nijivoice.com/api/platform/v1/voice-actors/${voiceActorId}/generate-voice`,
      {
        script,
        speed: speed.toString(),
        format: 'wav',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': nijivoiceApiKey,
        },
        timeout: 30000,
      }
    )

    const audioUrl = response.data.generatedVoice.audioFileUrl

    const audioResponse = await axios.get(audioUrl, {
      responseType: 'stream',
      timeout: 30000,
    })

    res.setHeader('Content-Type', 'audio/mpeg')
    audioResponse.data.pipe(res)
  } catch (error) {
    console.error('Error in Nijivoice TTS:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
