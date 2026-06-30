import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { guardServerSecretAccess } from '@/lib/api-services/serverSecretGuard'

type Data = {
  audio?: ArrayBuffer
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const {
    text,
    speaker,
    speed,
    pitch,
    intonationScale,
    serverUrl,
    tempoDynamics = 1.0,
    prePhonemeLength = 0.1,
    postPhonemeLength = 0.1,
  } = req.body
  const usesServerConfiguredUrl =
    !serverUrl && Boolean(process.env.AIVIS_SPEECH_SERVER_URL)
  const apiUrl =
    serverUrl || process.env.AIVIS_SPEECH_SERVER_URL || 'http://localhost:10101'

  let parsedUrl: URL
  try {
    parsedUrl = new URL(apiUrl)
  } catch {
    return res.status(400).json({ error: 'Invalid server URL' })
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: 'Invalid server URL protocol' })
  }

  if (
    usesServerConfiguredUrl &&
    !guardServerSecretAccess(req, res, { featureName: 'tts-aivisspeech' })
  ) {
    return
  }

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
    queryData.intonationScale = intonationScale
    queryData.tempoDynamicsScale = tempoDynamics
    queryData.prePhonemeLength = prePhonemeLength
    queryData.postPhonemeLength = postPhonemeLength

    // 2. 音声合成
    const synthesisResponse = await axios.post(
      `${apiUrl}/synthesis?speaker=${speaker}`,
      queryData,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/wav',
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    )

    res.setHeader('Content-Type', 'audio/wav')
    res.end(Buffer.from(synthesisResponse.data))
  } catch (error) {
    console.error('Error in AivisSpeech TTS:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
