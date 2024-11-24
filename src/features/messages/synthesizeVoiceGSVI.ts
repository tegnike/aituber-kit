import { Talk } from './messages'

export async function synthesizeVoiceGSVIApi(
  talk: Talk,
  url: string,
  character: string,
  batchsize: number,
  speed: number
): Promise<ArrayBuffer> {
  try {
    const style = 'default'
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
      throw new Error(
        `GSVI APIからの応答が異常です。ステータスコード: ${response.status}`
      )
    }

    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()
    return buffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`GSVIでエラーが発生しました: ${error.message}`)
    } else {
      throw new Error('GSVIで不明なエラーが発生しました')
    }
  }
}
