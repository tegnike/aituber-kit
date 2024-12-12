import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import englishToJapanese from '@/utils/englishToJapanese.json'
import { Talk } from './messages'
import { synthesizeStyleBertVITS2Api } from './synthesizeStyleBertVITS2'
import { synthesizeVoiceKoeiromapApi } from './synthesizeVoiceKoeiromap'
import { synthesizeVoiceElevenlabsApi } from './synthesizeVoiceElevenlabs'
import { synthesizeVoiceGoogleApi } from './synthesizeVoiceGoogle'
import { synthesizeVoiceVoicevoxApi } from './synthesizeVoiceVoicevox'
import { synthesizeVoiceAivisSpeechApi } from './synthesizeVoiceAivisSpeech'
import { synthesizeVoiceGSVIApi } from './synthesizeVoiceGSVI'
import { synthesizeVoiceOpenAIApi } from './synthesizeVoiceOpenAI'
import { synthesizeVoiceAzureOpenAIApi } from './synthesizeVoiceAzureOpenAI'
import toastStore from '@/features/stores/toast'
import i18next from 'i18next'
import { SpeakQueue } from './speakQueue'
import { synthesizeVoiceNijivoiceApi } from './synthesizeVoiceNijivoice'

interface EnglishToJapanese {
  [key: string]: string
}

const typedEnglishToJapanese = englishToJapanese as EnglishToJapanese

const speakQueue = new SpeakQueue()

function preprocessMessage(
  message: string,
  settings: ReturnType<typeof settingsStore.getState>
): string | null {
  // 前後の空白を削除
  let processed = message.trim()

  // 英語から日本語への変換
  if (settings.changeEnglishToJapanese && settings.selectLanguage === 'ja') {
    processed = convertEnglishToJapaneseReading(processed)
  }

  // 絵文字を削除
  processed = processed.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/gu,
    ''
  )

  // 空文字列の場合はnullを返す
  return processed || null
}

const createSpeakCharacter = () => {
  return (talk: Talk, onStart?: () => void, onComplete?: () => void) => {
    const ss = settingsStore.getState()
    onStart?.()

    const processedMessage = preprocessMessage(talk.message, ss)
    if (!processedMessage && !talk.buffer) {
      return
    }

    if (processedMessage) {
      talk.message = processedMessage
    }

    let isNeedDecode = true

    // audioBufferのフェッチを開始
    const audioBufferPromise: Promise<ArrayBuffer | null> = (async () => {
      try {
        if (talk.message === '' && talk.buffer) {
          isNeedDecode = false
          return talk.buffer
        } else if (ss.audioMode) {
          return null
        }

        // 選択されたボイスに応じたTTS APIを呼び出す
        switch (ss.selectVoice) {
          case 'koeiromap':
            return await synthesizeVoiceKoeiromapApi(
              talk,
              ss.koeiromapKey,
              ss.koeiroParam
            )
          case 'voicevox':
            return await synthesizeVoiceVoicevoxApi(
              talk,
              ss.voicevoxSpeaker,
              ss.voicevoxSpeed,
              ss.voicevoxPitch,
              ss.voicevoxIntonation
            )
          case 'google':
            return await synthesizeVoiceGoogleApi(
              talk,
              ss.googleTtsType,
              ss.selectLanguage
            )
          case 'stylebertvits2':
            return await synthesizeStyleBertVITS2Api(
              talk,
              ss.stylebertvits2ServerUrl,
              ss.stylebertvits2ApiKey,
              ss.stylebertvits2ModelId,
              ss.stylebertvits2Style,
              ss.stylebertvits2SdpRatio,
              ss.stylebertvits2Length,
              ss.selectLanguage
            )
          case 'aivis_speech':
            return await synthesizeVoiceAivisSpeechApi(
              talk,
              ss.aivisSpeechSpeaker,
              ss.aivisSpeechSpeed,
              ss.aivisSpeechPitch,
              ss.aivisSpeechIntonation
            )
          case 'gsvitts':
            return await synthesizeVoiceGSVIApi(
              talk,
              ss.gsviTtsServerUrl,
              ss.gsviTtsModelId,
              ss.gsviTtsBatchSize,
              ss.gsviTtsSpeechRate
            )
          case 'elevenlabs':
            return await synthesizeVoiceElevenlabsApi(
              talk,
              ss.elevenlabsApiKey,
              ss.elevenlabsVoiceId,
              ss.selectLanguage
            )
          case 'openai':
            return await synthesizeVoiceOpenAIApi(
              talk,
              ss.openaiTTSKey || ss.openaiKey,
              ss.openaiTTSVoice,
              ss.openaiTTSModel,
              ss.openaiTTSSpeed
            )
          case 'azure':
            return await synthesizeVoiceAzureOpenAIApi(
              talk,
              ss.azureTTSKey || ss.azureKey,
              ss.azureTTSEndpoint || ss.azureEndpoint,
              ss.openaiTTSVoice,
              ss.openaiTTSSpeed
            )
          case 'nijivoice':
            return await synthesizeVoiceNijivoiceApi(
              talk,
              ss.nijivoiceApiKey,
              ss.nijivoiceActorId,
              ss.nijivoiceSpeed
            )
          default:
            throw new Error('Unsupported voice type')
        }
      } catch (error) {
        handleTTSError(error, ss.selectVoice)
        return null
      }
    })()

    // タスクをSpeakQueueに追加
    speakQueue.addTask({
      audioBufferPromise,
      talk,
      isNeedDecode,
      onComplete,
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
    emotion: 'neutral',
  }
  const buffer = await synthesizeVoiceVoicevoxApi(
    talk,
    ss.voicevoxSpeaker,
    ss.voicevoxSpeed,
    ss.voicevoxPitch,
    ss.voicevoxIntonation
  ).catch(() => null)
  if (buffer) {
    const hs = homeStore.getState()
    await hs.viewer.model?.speak(buffer, talk)
  }
}

export const testAivisSpeech = async () => {
  const ss = settingsStore.getState()
  const talk: Talk = {
    message: 'AIVIS Speechを使用します',
    emotion: 'neutral',
  }
  const buffer = await synthesizeVoiceAivisSpeechApi(
    talk,
    ss.aivisSpeechSpeaker,
    ss.aivisSpeechSpeed,
    ss.aivisSpeechPitch,
    ss.aivisSpeechIntonation
  ).catch(() => null)
  if (buffer) {
    const hs = homeStore.getState()
    await hs.viewer.model?.speak(buffer, talk)
  }
}
