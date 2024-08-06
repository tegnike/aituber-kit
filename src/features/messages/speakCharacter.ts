import { Language } from '@/features/constants/settings'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import englishToJapanese from '@/utils/englishToJapanese.json'
import { wait } from '@/utils/wait'
import { Screenplay, Talk } from './messages'
import { synthesizeStyleBertVITS2Api } from './synthesizeStyleBertVITS2'
import { synthesizeVoiceApi } from './synthesizeVoice'
import { synthesizeVoiceElevenlabsApi } from './synthesizeVoiceElevenlabs'
import { synthesizeVoiceGoogleApi } from './synthesizeVoiceGoogle'

interface EnglishToJapanese {
  [key: string]: string
}

const VOICE_VOX_API_URL =
  process.env.NEXT_PUBLIC_VOICE_VOX_API_URL || 'http://localhost:50021'
const typedEnglishToJapanese = englishToJapanese as EnglishToJapanese

const createSpeakCharacter = () => {
  let lastTime = 0
  let prevFetchPromise: Promise<unknown> = Promise.resolve()
  let prevSpeakPromise: Promise<unknown> = Promise.resolve()

  return (
    screenplay: Screenplay,
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    const ss = settingsStore.getState()
    onStart?.()

    if (ss.changeEnglishToJapanese && ss.selectLanguage === 'ja') {
      // 英単語を日本語で読み上げる
      screenplay.talk.message = convertEnglishToJapaneseReading(
        screenplay.talk.message
      )
    }

    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now()
      if (now - lastTime < 1000) {
        await wait(1000 - (now - lastTime))
      }
      let buffer
      if (ss.selectVoice == 'koeiromap') {
        buffer = await fetchAudio(screenplay.talk, ss.koeiromapKey).catch(
          () => null
        )
      } else if (ss.selectVoice == 'voicevox') {
        buffer = await fetchAudioVoiceVox(
          screenplay.talk,
          ss.voicevoxSpeaker
        ).catch(() => null)
      } else if (ss.selectVoice == 'google') {
        const googleTtsTypeByLang = getGoogleTtsType(
          ss.googleTtsType,
          ss.selectLanguage
        )
        buffer = await fetchAudioGoogle(
          screenplay.talk,
          googleTtsTypeByLang
        ).catch(() => null)
      } else if (ss.selectVoice == 'stylebertvits2') {
        buffer = await fetchAudioStyleBertVITS2(
          screenplay.talk,
          ss.stylebertvits2ServerUrl,
          ss.stylebertvits2ModelId,
          ss.stylebertvits2Style,
          ss.selectLanguage
        ).catch(() => null)
      } else if (ss.selectVoice == 'gsvitts') {
        buffer = await fetchAudioVoiceGSVIApi(
          screenplay.talk,
          ss.gsviTtsServerUrl,
          ss.gsviTtsModelId,
          ss.gsviTtsBatchSize,
          ss.gsviTtsSpeechRate
        ).catch(() => null)
      } else if (ss.selectVoice == 'elevenlabs') {
        buffer = await fetchAudioElevenlabs(
          screenplay.talk,
          ss.elevenlabsApiKey,
          ss.elevenlabsVoiceId,
          ss.selectLanguage
        ).catch(() => null)
      }
      lastTime = Date.now()
      return buffer
    })

    prevFetchPromise = fetchPromise
    prevSpeakPromise = Promise.all([fetchPromise, prevSpeakPromise]).then(
      ([audioBuffer]) => {
        if (!audioBuffer) {
          return
        }
        const hs = homeStore.getState()
        return hs.viewer.model?.speak(audioBuffer, screenplay)
      }
    )
    prevSpeakPromise.then(() => {
      onComplete?.()
    })
  }
}

function convertEnglishToJapaneseReading(text: string): string {
  const sortedKeys = Object.keys(typedEnglishToJapanese).sort(
    (a, b) => b.length - a.length
  )

  return sortedKeys.reduce((result, englishWord) => {
    const japaneseReading = typedEnglishToJapanese[englishWord]
    const regex = new RegExp(`\\b${englishWord}\\b`, 'gi')
    return result.replace(regex, japaneseReading)
  }, text)
}

function getGoogleTtsType(
  googleTtsType: string,
  selectLanguage: Language
): string {
  if (googleTtsType) return googleTtsType
  return getGppgleTtsType(selectLanguage) || ''
}

function getGppgleTtsType(selectLanguage: Language): string {
  switch (selectLanguage) {
    case 'ja':
      return 'ja-JP-Standard-B'
    case 'en':
      return 'en-US-Neural2-F'
    case 'zh':
      return 'cmn-TW-Standard-A'
    default:
      return 'en-US-Neural2-F'
  }
}

export const speakCharacter = createSpeakCharacter()

export const fetchAudio = async (
  talk: Talk,
  apiKey: string
): Promise<ArrayBuffer> => {
  const ttsVoice = await synthesizeVoiceApi(
    talk.message,
    talk.speakerX,
    talk.speakerY,
    talk.style,
    apiKey
  )
  const url = ttsVoice.audio

  if (url == null) {
    throw new Error('Something went wrong')
  }

  const resAudio = await fetch(url)
  const buffer = await resAudio.arrayBuffer()
  return buffer
}

export const fetchAudioVoiceVox = async (
  talk: Talk,
  speaker: string
): Promise<ArrayBuffer> => {
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

  ttsQueryJson['speedScale'] = 1.1
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

export const fetchAudioGoogle = async (
  talk: Talk,
  ttsType: string
): Promise<ArrayBuffer> => {
  const ttsVoice = await synthesizeVoiceGoogleApi(talk.message, ttsType)
  const uint8Array = new Uint8Array(ttsVoice.audio.data)
  const arrayBuffer: ArrayBuffer = uint8Array.buffer

  return arrayBuffer
}

export const fetchAudioStyleBertVITS2 = async (
  talk: Talk,
  stylebertvits2ServerUrl: string,
  stylebertvits2ModelId: string,
  stylebertvits2Style: string,
  selectLanguage: Language
): Promise<ArrayBuffer> => {
  const ttsVoice = await synthesizeStyleBertVITS2Api(
    talk.message,
    stylebertvits2ServerUrl,
    stylebertvits2ModelId,
    stylebertvits2Style,
    selectLanguage
  )
  return ttsVoice
}

export const testVoice = async (voicevoxSpeaker: string) => {
  const talk: Talk = {
    message: 'ボイスボックスを使用します',
    speakerX: 0,
    speakerY: 0,
    style: 'talk',
  }
  const buffer = await fetchAudioVoiceVox(talk, voicevoxSpeaker).catch(
    () => null
  )
  if (buffer) {
    const screenplay: Screenplay = {
      expression: 'neutral',
      talk: talk,
    }
    const hs = homeStore.getState()
    await hs.viewer.model?.speak(buffer, screenplay)
  }
}

export const fetchAudioVoiceGSVIApi = async (
  talk: Talk,
  url: string,
  character: string,
  batchsize: number,
  speed: number
): Promise<ArrayBuffer> => {
  const style = talk.style !== 'talk' ? talk.style : 'default'
  const response = await fetch(url, {
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

export const fetchAudioElevenlabs = async (
  talk: Talk,
  apiKey: string,
  voiceId: string,
  language: Language
): Promise<ArrayBuffer> => {
  const ttsVoice = await synthesizeVoiceElevenlabsApi(
    apiKey,
    talk.message,
    voiceId,
    language
  )

  // const uint8Array = new Uint8Array(ttsVoice.audio);
  const arrayBuffer: ArrayBuffer = ttsVoice.audio.buffer

  return arrayBuffer
}
