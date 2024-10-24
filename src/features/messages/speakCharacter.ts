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
import toastStore from '@/features/stores/toast'
import i18next from 'i18next'

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

    let isNeedDecode = true

    const fetchPromise = prevFetchPromise.then(async () => {
      const now = Date.now()
      if (now - lastTime < 1000) {
        await wait(1000 - (now - lastTime))
      }

      let buffer
      try {
        if (screenplay.talk.message == '' && screenplay.talk.buffer) {
          buffer = screenplay.talk.buffer
          isNeedDecode = false
        } else if (ss.selectVoice == 'koeiromap') {
          buffer = await synthesizeVoiceKoeiromapApi(
            screenplay.talk,
            ss.koeiromapKey
          )
        } else if (ss.selectVoice == 'voicevox') {
          buffer = await synthesizeVoiceVoicevoxApi(
            screenplay.talk,
            ss.voicevoxSpeaker,
            ss.voicevoxSpeed,
            ss.voicevoxPitch,
            ss.voicevoxIntonation
          )
        } else if (ss.selectVoice == 'google') {
          buffer = await synthesizeVoiceGoogleApi(
            screenplay.talk,
            ss.googleTtsType,
            ss.selectLanguage
          )
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
          )
        } else if (ss.selectVoice == 'gsvitts') {
          buffer = await synthesizeVoiceGSVIApi(
            screenplay.talk,
            ss.gsviTtsServerUrl,
            ss.gsviTtsModelId,
            ss.gsviTtsBatchSize,
            ss.gsviTtsSpeechRate
          )
        } else if (ss.selectVoice == 'elevenlabs') {
          buffer = await synthesizeVoiceElevenlabsApi(
            screenplay.talk,
            ss.elevenlabsApiKey,
            ss.elevenlabsVoiceId,
            ss.selectLanguage
          )
        }
      } catch (error) {
        handleTTSError(error, ss.selectVoice)
        return null
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
        return hs.viewer.model?.speak(audioBuffer, screenplay, isNeedDecode)
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

function handleTTSError(error: unknown, serviceName: string): void {
  let message: string
  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else {
    message = i18next.t('Errors.UnexpectedError')
  }
  const errorMessage = i18next.t('Errors.TTSServiceError', {
    serviceName,
    message,
  })

  toastStore.getState().addToast({
    message: errorMessage,
    type: 'error',
    duration: 5000,
    tag: 'tts-error',
  })

  console.error(errorMessage)
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
