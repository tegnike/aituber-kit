import { Talk } from './messages'

export async function synthesizeVoiceAicuApi(
  talk: Talk,
  aicuSlug: string = 'luc4'
) {
  try {
    const body = {
      message: talk.message,
      slug: aicuSlug,
    }

    const res = await fetch('/api/tts-aicu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `AICU Text-to-Speech APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const data = await res.json()

    // Base64文字列をデコードしてArrayBufferに変換
    const binaryStr = atob(data.audio)
    const uint8Array = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      uint8Array[i] = binaryStr.charCodeAt(i)
    }
    const arrayBuffer: ArrayBuffer = uint8Array.buffer

    return arrayBuffer
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `AICU Text-to-Speechでエラーが発生しました: ${error.message}`
      )
    } else {
      throw new Error('AICU Text-to-Speechで不明なエラーが発生しました')
    }
  }
}
