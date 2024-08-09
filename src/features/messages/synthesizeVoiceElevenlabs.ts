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
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_16000`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: message,
        model_id: 'eleven_turbo_v2_5',
        language_code: language,
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`ElevenLabs API request failed with status: ${res.status}`)
  }

  const pcmData = await res.arrayBuffer()
  const wavHeader = createWavHeader(pcmData.byteLength)
  const wavData = new Uint8Array(wavHeader.byteLength + pcmData.byteLength)
  wavData.set(new Uint8Array(wavHeader), 0)
  wavData.set(new Uint8Array(pcmData), wavHeader.byteLength)

  // Convert the ArrayBuffer to a Blob
  const blob = new Blob([wavData.buffer], { type: 'audio/wav' })

  // Create a temporary URL for the Blob
  const audioURL = URL.createObjectURL(blob)

  // return { audio: audioURL };
  return { audio: wavData }
}
