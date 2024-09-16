import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  audio?: Buffer
  error?: string
}

function createWavHeader(dataLength: number) {
  const buffer = new ArrayBuffer(44)
  const view = new DataView(buffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, 16000, true) // sample rate
  view.setUint32(28, 16000 * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  return buffer
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body = req.body
  const message = body.message
  const voiceId = body.voiceId || process.env.ELEVENLABS_VOICE_ID
  const apiKey = body.apiKey || process.env.ELEVENLABS_API_KEY
  const language = body.language

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Empty API Key', errorCode: 'EmptyAPIKey' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
  if (!voiceId) {
    return new Response(
      JSON.stringify({ error: 'Empty Voice ID', errorCode: 'EMPTY_PROPERTY' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_16000`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: message,
          model_id: 'eleven_turbo_v2_5',
          language_code: language,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(
        `ElevenLabs APIからの応答が異常です。ステータスコード: ${response.status}`
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const wavHeader = createWavHeader(arrayBuffer.byteLength)
    const fullBuffer = Buffer.concat([
      Buffer.from(wavHeader),
      Buffer.from(arrayBuffer),
    ])

    res.writeHead(200, {
      'Content-Type': 'audio/wav',
      'Content-Length': fullBuffer.length,
    })
    res.end(fullBuffer)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
