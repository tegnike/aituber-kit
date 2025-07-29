import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type Data = {
  audio?: ArrayBuffer
  error?: string
}

interface AivisCloudRequestBody {
  model_uuid: string
  text: string
  use_ssml: boolean
  speaking_rate: number
  pitch: number
  emotional_intensity: number
  tempo_dynamics_scale: number
  pre_phoneme_length: number
  post_phoneme_length: number
  output_format: string
  output_sampling_rate: number
  output_audio_channels: string
  style_id?: number
  style_name?: string
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

function isValidApiKey(apiKey: string): boolean {
  // Aivis API keys typically start with 'aivis_' and have a minimum length
  return apiKey.startsWith('aivis_') && apiKey.length >= 20
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const {
    text,
    modelUuid,
    styleId,
    styleName,
    useStyleName = false,
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

  if (!isValidApiKey(aivisCloudApiKey)) {
    return res.status(400).json({ error: 'Invalid API key format' })
  }

  if (!modelUuid) {
    return res.status(400).json({ error: 'Model UUID is required' })
  }

  if (!isValidUUID(modelUuid)) {
    return res.status(400).json({ error: 'Invalid model UUID format' })
  }

  if (!text) {
    return res.status(400).json({ error: 'Text is required' })
  }

  if (text.length > 10000) {
    return res
      .status(400)
      .json({ error: 'Text too long (max 10000 characters)' })
  }

  try {
    const requestBody: AivisCloudRequestBody = {
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

    // スタイルIDまたはスタイル名を追加（仕様上は併用不可）
    if (useStyleName && styleName && styleName.trim() !== '') {
      // スタイル名が指定されている場合
      if (styleName.length > 20) {
        return res
          .status(400)
          .json({ error: 'Style name too long (max 20 characters)' })
      }
      requestBody.style_name = styleName.trim()
    } else if (styleId !== undefined && styleId !== null) {
      // スタイルIDが指定されている場合
      if (styleId < 0 || styleId > 31) {
        return res
          .status(400)
          .json({ error: 'Style ID must be between 0 and 31' })
      }
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
