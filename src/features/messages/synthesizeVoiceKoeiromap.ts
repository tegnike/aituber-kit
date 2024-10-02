import { reduceTalkStyle } from '@/utils/reduceTalkStyle'
import { TalkStyle } from '../messages/messages'

export async function synthesizeVoiceKoeiromapApi(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle,
  apiKey: string
) {
  const reducedStyle = reduceTalkStyle(style)

  const body = {
    message: message,
    speakerX: speakerX,
    speakerY: speakerY,
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

  return { audio: data.audio }
}
