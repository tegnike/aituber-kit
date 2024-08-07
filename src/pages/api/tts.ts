import { koeiromapFreeV1 } from '@/features/koeiromap/koeiromap'
import { googleTts } from '@/features/googletts/googletts'

import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  audio: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const message = req.body.message
  const speakerX = req.body.speakerX
  const speakerY = req.body.speakerY
  const style = req.body.style
  const apiKey = req.body.apiKey
  const ttsType = req.body.ttsType
  const type = req.body.type

  let voice

  if (type == 'koeiromap') {
    voice = await koeiromapFreeV1(message, speakerX, speakerY, style, apiKey)
  } else {
    voice = await googleTts(message, ttsType)
  }

  res.status(200).json(voice)
}
