import type { NextApiRequest, NextApiResponse } from 'next'
import {
  defaultModels,
  openAIRealtimeModels,
} from '@/features/constants/aiModels'
import { routePolicies } from '@/lib/accessPolicy/routePolicies'
import { withAccessPolicy } from '@/lib/accessPolicy/withAccessPolicy'

type RequestBody = {
  apiKey?: string
  model?: string
  sessionType?: 'realtime' | 'transcription'
  languages?: string[]
}

type OpenAIRealtimeClientSecretResponse = {
  value?: string
  expires_at?: number
  session?: unknown
  error?: { message?: string }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    apiKey,
    model,
    sessionType = 'realtime',
    languages,
  } = req.body as RequestBody
  const openaiKey =
    apiKey || process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || ''

  if (!openaiKey) {
    return res.status(400).json({
      error: 'Empty API Key',
      errorCode: 'EmptyAPIKey',
    })
  }

  if (sessionType !== 'realtime' && sessionType !== 'transcription') {
    return res.status(400).json({
      error: 'Invalid Realtime session type',
      errorCode: 'InvalidRealtimeSessionType',
    })
  }

  const isTranscriptionSession = sessionType === 'transcription'
  const modelName = isTranscriptionSession
    ? 'gpt-live-transcribe'
    : typeof model === 'string' && model
      ? model
      : defaultModels.openaiRealtime

  if (
    isTranscriptionSession &&
    typeof model === 'string' &&
    model !== 'gpt-live-transcribe'
  ) {
    return res.status(400).json({
      error: 'Unsupported live transcription model',
      errorCode: 'InvalidLiveTranscriptionModel',
    })
  }

  if (
    !isTranscriptionSession &&
    !openAIRealtimeModels.includes(
      modelName as (typeof openAIRealtimeModels)[number]
    )
  ) {
    return res.status(400).json({
      error: 'Unsupported Realtime API model',
      errorCode: 'InvalidRealtimeModel',
    })
  }

  const transcriptionLanguages = Array.isArray(languages)
    ? languages
        .filter((language): language is string => typeof language === 'string')
        .map((language) => language.trim().toLowerCase())
        .filter((language) => /^[a-z]{2,3}(?:-[a-z]{2})?$/.test(language))
        .slice(0, 8)
    : []
  const session = isTranscriptionSession
    ? {
        type: 'transcription' as const,
        audio: {
          input: {
            format: {
              type: 'audio/pcm' as const,
              rate: 24000,
            },
            transcription: {
              model: modelName,
              delay: 'low' as const,
              ...(transcriptionLanguages.length > 0
                ? { languages: transcriptionLanguages }
                : {}),
            },
            // gpt-live-transcribeはturn detectionを受け付けないため、
            // クライアント側の無音タイマーでcommitする。
            turn_detection: null,
          },
        },
      }
    : {
        type: 'realtime' as const,
        model: modelName,
      }

  const response = await fetch(
    'https://api.openai.com/v1/realtime/client_secrets',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session,
      }),
    }
  )

  const data = (await response
    .json()
    .catch(() => ({}))) as OpenAIRealtimeClientSecretResponse

  if (!response.ok) {
    return res.status(response.status).json({
      error:
        data.error?.message || 'OpenAI Realtime client secret request failed',
      errorCode: 'OpenAIRealtimeClientSecretError',
    })
  }

  if (!data.value) {
    return res.status(502).json({
      error: 'OpenAI Realtime client secret response was empty',
      errorCode: 'OpenAIRealtimeClientSecretEmpty',
    })
  }

  return res.status(200).json({
    value: data.value,
    expires_at: data.expires_at,
    session: data.session,
  })
}

export default withAccessPolicy(
  routePolicies['/api/ai/realtime-client-secret'],
  handler
)
