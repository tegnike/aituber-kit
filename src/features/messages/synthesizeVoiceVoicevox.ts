import { Talk } from './messages'

const VOICE_VOX_API_URL = 'http://localhost:50021'

export async function synthesizeVoiceVoicevoxApi(
  talk: Talk,
  speaker: string,
  speed: number,
  pitch: number,
  intonation: number
): Promise<ArrayBuffer> {
  console.log('speakerId:', speaker)
  const ttsQueryResponse = await fetch(
    VOICE_VOX_API_URL +
      '/audio_query?speaker=' +
      speaker +
      '&text=' +
      encodeURIComponent(talk.message),
    {
      method: 'POST',
    }
  )
  if (!ttsQueryResponse.ok) {
    throw new Error('Failed to fetch TTS query.')
  }
  const ttsQueryJson = await ttsQueryResponse.json()

  ttsQueryJson['speedScale'] = speed
  ttsQueryJson['pitchScale'] = pitch
  ttsQueryJson['intonationScale'] = intonation
  const synthesisResponse = await fetch(
    VOICE_VOX_API_URL + '/synthesis?speaker=' + speaker,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked',
      },
      body: JSON.stringify(ttsQueryJson),
    }
  )
  if (!synthesisResponse.ok) {
    throw new Error('Failed to fetch TTS synthesis result.')
  }
  const blob = await synthesisResponse.blob()
  const buffer = await blob.arrayBuffer()
  return buffer
}
