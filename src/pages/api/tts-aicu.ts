import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  audio?: string // Base64 encoded string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const message = req.body.message
  const slug = req.body.slug || 'luc4'

  const apiKey = process.env.AICU_API_KEY

  if (!apiKey) {
    res.status(500).json({ error: 'AICU_API_KEY is not configured' })
    return
  }

  try {
    const response = await fetch('https://api.aicu.ai/api/v1/tts/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        slug: slug,
        format: 'mp3',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AICU API error ${response.status}: ${errorText}`)
    }

    // Get audio as ArrayBuffer and convert to Base64
    const audioBuffer = await response.arrayBuffer()
    const audioContent = Buffer.from(audioBuffer).toString('base64')

    res.status(200).json({ audio: audioContent })
  } catch (error) {
    console.error('Error in AICU Text-to-Speech:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
