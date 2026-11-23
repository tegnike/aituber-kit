import type { NextApiRequest, NextApiResponse } from 'next'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'

const WAFFLE_TTS_URL = 'https://aniwaffle.com/v1/tts'
const SAMPLE_RATE = 48000

type Data = {
  error?: string
  errorCode?: string
}

interface RequestBody {
  message: string
  voiceId?: string
  apiKey?: string
}

// Waffle は 16bit PCM（ヘッダーなし）を返すので、再生用に WAV ヘッダーを付ける
function pcmToWav(pcm: Buffer, sampleRate: number, channels: number): Buffer {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * channels * 2, 28)
  header.writeUInt16LE(channels * 2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const body = req.body as RequestBody
  const message = body.message
  const voiceId = body.voiceId || process.env.ANIWAFFLE_VOICE_ID
  const apiKey = body.apiKey || process.env.ANIWAFFLE_API_KEY

  if (!apiKey) {
    res.status(400).json({ error: 'Empty API Key', errorCode: 'EmptyAPIKey' })
    return
  }
  if (!voiceId) {
    res
      .status(400)
      .json({ error: 'Empty Voice ID', errorCode: 'EMPTY_PROPERTY' })
    return
  }

  try {
    const response = await fetch(WAFFLE_TTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        voice_id: voiceId,
        output_format: `pcm_${SAMPLE_RATE}`,
      }),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      res.status(response.status).json({
        error: `Waffle APIからの応答が異常です。ステータスコード: ${response.status} ${detail}`,
      })
      return
    }

    const channels = Number(response.headers.get('x-audio-channels')) || 1
    const wav = pcmToWav(
      Buffer.from(await response.arrayBuffer()),
      SAMPLE_RATE,
      channels
    )

    res.writeHead(200, {
      'Content-Type': 'audio/wav',
      'Content-Length': wav.length,
    })
    res.end(wav)
  } catch (error) {
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : String(error) })
  }
}

export default withAccessPolicy(routePolicies['/api/tts-waffle'], handler)
