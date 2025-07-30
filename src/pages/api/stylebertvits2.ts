import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  audio?: Buffer
  error?: string
}

const getLanguageCode = (selectLanguage: string): string => {
  switch (selectLanguage) {
    case 'ja':
      return 'JP'
    case 'en':
      return 'EN'
    case 'zh':
      return 'ZH'
    default:
      return 'EN'
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const body = req.body // JSON.parse を削除
  const message = body.message
  const stylebertvits2ModelId = body.stylebertvits2ModelId
  const stylebertvits2ServerUrl =
    body.stylebertvits2ServerUrl || process.env.STYLEBERTVITS2_SERVER_URL
  const stylebertvits2ApiKey =
    body.stylebertvits2ApiKey || process.env.STYLEBERTVITS2_API_KEY
  const stylebertvits2Style = body.stylebertvits2Style
  const stylebertvits2SdpRatio = body.stylebertvits2SdpRatio
  const stylebertvits2Length = body.stylebertvits2Length
  const selectLanguage = getLanguageCode(body.selectLanguage)

  try {
    if (!stylebertvits2ServerUrl.includes('https://api.runpod.ai')) {
      const queryParams = new URLSearchParams({
        text: message,
        model_id: stylebertvits2ModelId,
        style: stylebertvits2Style,
        sdp_ratio: stylebertvits2SdpRatio,
        length: stylebertvits2Length,
        language: selectLanguage,
      })

      const voice = await fetch(
        `${stylebertvits2ServerUrl.replace(/\/$/, '')}/voice?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'audio/wav',
          },
        }
      )

      if (!voice.ok) {
        throw new Error(
          `サーバーからの応答が異常です。ステータスコード: ${voice.status}`
        )
      }

      const arrayBuffer = await voice.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length,
      })
      res.end(buffer)
    } else {
      const voice = await fetch(
        `${stylebertvits2ServerUrl.replace(/\/$/, '')}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${stylebertvits2ApiKey}`,
          },
          body: JSON.stringify({
            input: {
              action: '/voice',
              model_id: stylebertvits2ModelId,
              text: message,
              style: stylebertvits2Style,
              sdp_ratio: stylebertvits2SdpRatio,
              length: stylebertvits2Length,
              language: selectLanguage,
            },
          }),
        }
      )

      if (!voice.ok) {
        throw new Error(
          `サーバーからの応答が異常です。ステータスコード: ${voice.status}`
        )
      }

      const voiceData = await voice.json()
      const base64Audio = voiceData.output.voice
      const buffer = Buffer.from(base64Audio, 'base64')

      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length,
      })
      res.end(buffer)
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
