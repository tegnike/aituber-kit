import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

// 感情表現を豊かにする追加指示を行うモデル、念の為リスト形式
const gpt4oEmotionalInstructionModels = ['gpt-4o']

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, voice, model, speed, apiKey, emotion } = req.body
  const openaiKey =
    apiKey || process.env.OPENAI_TTS_KEY || process.env.OPENAI_API_KEY

  if (!message || !voice || !model || !openaiKey) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const openai = new OpenAI({ apiKey: openaiKey })
    const options: {
      model: any
      voice: any
      speed: any
      input: any
      instructions?: any
    } = {
      model: model,
      voice: voice,
      speed: speed,
      input: message,
    }

    if (gpt4oEmotionalInstructionModels.some((m) => model.includes(m))) {
      options.instructions = `Please speak "${message}" with rich emotional expression.`
    }

    const mp3 = await openai.audio.speech.create(options)

    const buffer = Buffer.from(await mp3.arrayBuffer())

    res.setHeader('Content-Type', 'audio/mpeg')
    res.send(buffer)
  } catch (error) {
    console.error('OpenAI TTS error:', error)
    res.status(500).json({ error: 'Failed to generate speech' })
  }
}
