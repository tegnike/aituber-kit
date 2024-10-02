import { reduceTalkStyle } from '@/utils/reduceTalkStyle'
import { Talk } from './messages'

export async function synthesizeVoiceKoeiromapApi(talk: Talk, apiKey: string) {
  const reducedStyle = reduceTalkStyle(talk.style)

  const body = {
    message: talk.message,
    speakerX: talk.speakerX,
    speakerY: talk.speakerY,
    style: reducedStyle,
    apiKey: apiKey,
  }

  const res = await fetch('/api/tts-koeiromap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  const url = data.audio

  if (url == null) {
    throw new Error('Something went wrong')
  }

  const resAudio = await fetch(url)
  const buffer = await resAudio.arrayBuffer()
  return buffer
}
