import { Talk } from './messages'
import { synthesizeVoiceApi } from './synthesizeVoiceApi'
import { synthesizeVoicevoxInBrowser } from './voicevoxBrowserClient'
import type { VoicevoxConnectionMode } from '@/features/constants/settings'

export async function synthesizeVoiceVoicevoxApi(
  talk: Talk,
  speaker: string,
  speed: number,
  pitch: number,
  intonation: number,
  serverUrl: string,
  mode: VoicevoxConnectionMode = 'server'
): Promise<ArrayBuffer> {
  if (mode === 'browser') {
    return synthesizeVoicevoxInBrowser(
      talk.message,
      speaker,
      speed,
      pitch,
      intonation,
      serverUrl
    )
  }
  return synthesizeVoiceApi(
    '/api/tts-voicevox',
    { text: talk.message, speaker, speed, pitch, intonation, serverUrl },
    'VOICEVOX',
    {
      buildErrorMessage: (res) =>
        `VOICEVOXからの応答が異常です。ステータスコード: ${res.status}`,
    }
  )
}
