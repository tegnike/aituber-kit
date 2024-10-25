import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, voice, model, speed, apiKey } = req.body
  const openaiTTSKey = apiKey || process.env.OPENAI_TTS_KEY

  if (!message || !voice || !model || !openaiTTSKey) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const openai = new OpenAI({ apiKey: openaiTTSKey })

    const mp3 = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: message,
      speed: speed,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    res.setHeader('Content-Type', 'audio/mpeg')
    res.send(buffer)
  } catch (error) {
    console.error('OpenAI TTS error:', error)
    res.status(500).json({ error: 'Failed to generate speech' })
  }
}
