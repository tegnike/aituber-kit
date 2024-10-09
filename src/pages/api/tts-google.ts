import type { NextApiRequest, NextApiResponse } from 'next'
import textToSpeech from '@google-cloud/text-to-speech'
import { google } from '@google-cloud/text-to-speech/build/protos/protos'

type Data = {
  audio?: Uint8Array
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const message = req.body.message
  const ttsType = req.body.ttsType

  try {
    const client = new textToSpeech.TextToSpeechClient()

    const request: google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text: message },
      voice: { languageCode: 'ja-JP', name: ttsType },
      audioConfig: { audioEncoding: 'MP3' },
    }

    const [response] = await client.synthesizeSpeech(request)
    const audio = response.audioContent as Uint8Array

    res.status(200).json({ audio })
  } catch (error) {
    console.error('Error in Google TTS:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
