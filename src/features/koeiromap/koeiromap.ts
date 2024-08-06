import { TalkStyle } from '../messages/messages'

export async function koeiromapV0(
  message: string,
  speakerX: number,
  speakerY: number,
  style: TalkStyle
) {
  const param = {
    method: 'POST',
    body: JSON.stringify({
      text: message,
      speaker_x: speakerX,
      speaker_y: speakerY,
      style: style,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  }

  const koeiroRes = await fetch(
    'https://api.rinna.co.jp/models/cttse/koeiro',
    param
  )

  const data = (await koeiroRes.json()) as any

  return { audio: data.audio }
}

export async function koeiromapFreeV1(
  message: string,
  speakerX: number,
  speakerY: number,
  style: 'talk' | 'happy' | 'sad',
  apiKey: string
) {
  // Request body
  const body = {
    text: message,
    speaker_x: speakerX,
    speaker_y: speakerY,
    style: style,
    output_format: 'mp3',
  }

  const koeiroRes = await fetch(
    'https://api.rinna.co.jp/koeiromap/v1.0/infer',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Ocp-Apim-Subscription-Key': apiKey,
      },
    }
  )

  const data = (await koeiroRes.json()) as any

  return { audio: data.audio }
}
