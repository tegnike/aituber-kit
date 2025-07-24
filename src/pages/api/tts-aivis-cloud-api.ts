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
  const {
    text,
    modelUuid,
    styleId,
    apiKey,
    speed = 1.0,
    pitch = 0.0,
    emotionalIntensity = 1.0,
    tempoDynamics = 1.0,
    prePhonemeLength = 0.1,
    postPhonemeLength = 0.1,
    outputFormat = 'mp3',
  } = req.body

  const aivisCloudApiKey = apiKey || process.env.AIVIS_CLOUD_API_KEY
  if (!aivisCloudApiKey) {
    return res.status(400).json({ error: 'API key is required' })
  }

  if (!modelUuid) {
    return res.status(400).json({ error: 'Model UUID is required' })
  }

  if (!text) {
    return res.status(400).json({ error: 'Text is required' })
  }

  try {
    const requestBody: any = {
      model_uuid: modelUuid,
      text,
      use_ssml: true,
      speaking_rate: speed,
      pitch,
      emotional_intensity: emotionalIntensity,
      tempo_dynamics_scale: tempoDynamics,
      pre_phoneme_length: prePhonemeLength,
      post_phoneme_length: postPhonemeLength,
      output_format: outputFormat,
      output_sampling_rate: 44100,
      output_audio_channels: 'mono',
    }

    // スタイルIDが指定されている場合は追加
    if (styleId !== undefined && styleId !== null) {
      requestBody.style_id = styleId
    }

    const response = await axios.post(
      'https://api.aivis-project.com/v1/tts/synthesize',
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${aivisCloudApiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 60000, // Aivis Cloud APIは生成に時間がかかる場合があるため60秒に設定
      }
    )

    // レスポンスのContent-Typeを設定
    const contentType = response.headers['content-type'] || 'audio/mpeg'
    res.setHeader('Content-Type', contentType)

    // Aivis Cloud APIのカスタムヘッダーがあれば転送
    if (response.headers['x-aivis-character-count']) {
      res.setHeader(
        'X-Aivis-Character-Count',
        response.headers['x-aivis-character-count']
      )
    }
    if (response.headers['x-aivis-credits-remaining']) {
      res.setHeader(
        'X-Aivis-Credits-Remaining',
        response.headers['x-aivis-credits-remaining']
      )
    }
    if (response.headers['x-aivis-credits-used']) {
      res.setHeader(
        'X-Aivis-Credits-Used',
        response.headers['x-aivis-credits-used']
      )
    }

    response.data.pipe(res)
  } catch (error: any) {
    console.error('Error in Aivis Cloud API TTS:', error)

    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.detail || 'API Error'

      switch (status) {
        case 401:
          return res.status(401).json({ error: 'Invalid API key' })
        case 402:
          return res.status(402).json({ error: 'Insufficient credits' })
        case 404:
          return res.status(404).json({ error: 'Model not found' })
        case 422:
          return res.status(422).json({ error: 'Invalid request parameters' })
        case 429:
          return res.status(429).json({ error: 'Rate limit exceeded' })
        default:
          return res.status(status).json({ error: message })
      }
    }

    res.status(500).json({ error: 'Internal Server Error' })
  }
}
