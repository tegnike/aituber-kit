import { Talk } from './messages'

export async function synthesizeVoiceGSVIApi(
  talk: Talk,
  url: string,
  character: string,
  batchsize: number,
  speed: number
): Promise<ArrayBuffer> {
  const style = talk.style !== 'talk' ? talk.style : 'default'
  const response = await fetch(url.replace(/\/$/, ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      character: character,
      emotion: style,
      text: talk.message,
      batch_size: batchsize,
      speed: speed.toString(),
      stream: true,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch TTS audio.')
  }

  const blob = await response.blob()
  const buffer = await blob.arrayBuffer()
  return buffer
}
