import { Language } from '@/features/constants/settings'

function createWavHeader(dataLength: number) {
  const buffer = new ArrayBuffer(44)
  const view = new DataView(buffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, 16000, true) // sample rate
  view.setUint32(28, 16000 * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataLength, true)

  return buffer
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

export async function synthesizeVoiceElevenlabsApi(
  apiKey: string,
  message: string,
  voiceId: string,
  language: Language
) {
  const body = {
    message,
    voiceId,
    apiKey,
    language,
  }

  try {
    const res = await fetch('/api/elevenLabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(
        `APIからの応答が異常です。ステータスコード: ${res.status}`
      )
    }

    const buffer = await res.arrayBuffer()
    return { audio: new Uint8Array(buffer) }
  } catch (error: any) {
    throw new Error(`APIリクエスト中にエラーが発生しました: ${error.message}`)
  }
}
