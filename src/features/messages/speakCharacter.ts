import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import englishToJapanese from '@/utils/englishToJapanese.json'
import { wait } from '@/utils/wait'
import { Screenplay, Talk } from './messages'
import { synthesizeStyleBertVITS2Api } from './synthesizeStyleBertVITS2'
import { synthesizeVoiceKoeiromapApi } from './synthesizeVoiceKoeiromap'
import { synthesizeVoiceElevenlabsApi } from './synthesizeVoiceElevenlabs'
import { synthesizeVoiceGoogleApi } from './synthesizeVoiceGoogle'
import { synthesizeVoiceVoicevoxApi } from './synthesizeVoiceVoicevox'
import { synthesizeVoiceGSVIApi } from './synthesizeVoiceGSVI'

interface EnglishToJapanese {
  [key: string]: string
}

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
      return screenplay.talk.message
      let buffer
      if (ss.selectVoice == 'koeiromap') {
        buffer = await synthesizeVoiceKoeiromapApi(
          screenplay.talk,
          ss.koeiromapKey
        ).catch(() => null)
      } else if (ss.selectVoice == 'voicevox') {
        buffer = await synthesizeVoiceVoicevoxApi(
          screenplay.talk,
          ss.voicevoxSpeaker,
          ss.voicevoxSpeed,
          ss.voicevoxPitch,
          ss.voicevoxIntonation
        ).catch(() => null)
      } else if (ss.selectVoice == 'google') {
        buffer = await synthesizeVoiceGoogleApi(
          screenplay.talk,
          ss.googleTtsType,
          ss.selectLanguage
        ).catch(() => null)
      } else if (ss.selectVoice == 'stylebertvits2') {
        buffer = await synthesizeStyleBertVITS2Api(
          screenplay.talk,
          ss.stylebertvits2ServerUrl,
          ss.stylebertvits2ApiKey,
          ss.stylebertvits2ModelId,
          ss.stylebertvits2Style,
          ss.stylebertvits2SdpRatio,
          ss.stylebertvits2Length,
          ss.selectLanguage
        ).catch(() => null)
      } else if (ss.selectVoice == 'gsvitts') {
        buffer = await synthesizeVoiceGSVIApi(
          screenplay.talk,
          ss.gsviTtsServerUrl,
          ss.gsviTtsModelId,
          ss.gsviTtsBatchSize,
          ss.gsviTtsSpeechRate
        ).catch(() => null)
      } else if (ss.selectVoice == 'elevenlabs') {
        buffer = await synthesizeVoiceElevenlabsApi(
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

export const speakCharacter = createSpeakCharacter()

export const testVoiceVox = async () => {
  const ss = settingsStore.getState()
  const talk: Talk = {
    message: 'ボイスボックスを使用します',
    speakerX: 0,
    speakerY: 0,
    style: 'talk',
  }
  const buffer = await synthesizeVoiceVoicevoxApi(
    talk,
    ss.voicevoxSpeaker,
    ss.voicevoxSpeed,
    ss.voicevoxPitch,
    ss.voicevoxIntonation
  ).catch(() => null)
  if (buffer) {
    const screenplay: Screenplay = {
      expression: 'neutral',
      talk: talk,
    }
    const hs = homeStore.getState()
    await hs.viewer.model?.speak(buffer, screenplay)
  }
}
