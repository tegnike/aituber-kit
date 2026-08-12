import { logger } from '@/lib/logger'
import settingsStore from '@/features/stores/settings'
import { AIVoice } from '@/features/constants/settings'
import { wait } from '@/utils/wait'
import { Talk } from './messages'
import { synthesizeStyleBertVITS2Api } from './synthesizeStyleBertVITS2'
import { synthesizeVoiceKoeiromapApi } from './synthesizeVoiceKoeiromap'
import {
  synthesizeVoiceElevenlabsApi,
  synthesizeVoiceElevenlabsStreamApi,
} from './synthesizeVoiceElevenlabs'
import { synthesizeVoiceCartesiaApi } from './synthesizeVoiceCartesia'
import { synthesizeVoiceGoogleApi } from './synthesizeVoiceGoogle'
import { synthesizeVoiceVoicevoxApi } from './synthesizeVoiceVoicevox'
import { synthesizeVoiceAivisSpeechApi } from './synthesizeVoiceAivisSpeech'
import { synthesizeVoiceAivisCloudApi } from './synthesizeVoiceAivisCloudApi'
import { synthesizeVoiceGSVIApi } from './synthesizeVoiceGSVI'
import {
  synthesizeVoiceOpenAIApi,
  synthesizeVoiceOpenAIStreamApi,
} from './synthesizeVoiceOpenAI'
import { synthesizeVoiceAzureOpenAIApi } from './synthesizeVoiceAzureOpenAI'
import toastStore from '@/features/stores/toast'
import i18next from 'i18next'
import { SpeakQueue } from './speakQueue'
import { getCharacterRenderer } from './characterRenderer'
import {
  asyncConvertEnglishToJapaneseReading,
  containsEnglish,
} from '@/utils/textProcessing'
import { markConversationLatency } from '@/features/chat/conversationLatency'

const speakQueue = SpeakQueue.getInstance()
const SYNTHESIS_START_GAP_MS = 250

type SynthesizedSpeech =
  | {
      kind: 'buffer'
      audioBuffer: ArrayBuffer
      isNeedDecode: boolean
    }
  | {
      kind: 'pcm16-stream'
      audioStream: ReadableStream<Uint8Array>
      sampleRate: number
    }

type PendingSpeakResult = {
  sessionId: string
  audio: SynthesizedSpeech | null
  talk: Talk
  displayText?: string
  onPlaybackStart?: () => void
  onComplete?: () => void
  tokenAtStart: number
}

function disposeSynthesizedSpeech(
  audio: SynthesizedSpeech | null | undefined,
  onDisposed?: () => void
): void {
  const complete = () => {
    try {
      onDisposed?.()
    } catch (error) {
      logger.error('Discarded speech completion callback failed:', error)
    }
  }

  if (audio?.kind === 'pcm16-stream') {
    void audio.audioStream
      .cancel('speech discarded')
      .catch(() => {})
      .then(complete)
    return
  }
  complete()
}

export function preprocessMessage(
  message: string,
  settings: ReturnType<typeof settingsStore.getState>
): string | null {
  // 前後の空白を削除
  let processed: string | null = message.trim()
  if (!processed) return null

  // 絵文字を削除 (これを先に行うことで変換対象のテキスト量を減らす)
  processed = processed.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]/gu,
    ''
  )

  // 発音として不適切な記号のみで構成されているかチェック
  // 感嘆符、疑問符、句読点、括弧類、引用符、数学記号、その他一般的な記号を含む
  const isOnlySymbols: boolean =
    /^[!?.,。、．，'"(){}[\]<>+=\-*\/\\|;:@#$%^&*_~！？（）「」『』【】〔〕［］｛｝〈〉《》｢｣。、．，：；＋－＊／＝＜＞％＆＾｜～＠＃＄＿"　]+$/.test(
      processed
    )

  // 空文字列の場合はnullを返す
  if (processed === '' || isOnlySymbols) return null

  // 英語から日本語への変換は次の条件のみ実行
  // 1. 設定でオンになっている
  // 2. 言語が日本語
  // 3. テキストに英語のような文字が含まれている場合のみ
  if (
    settings.changeEnglishToJapanese &&
    settings.selectLanguage === 'ja' &&
    containsEnglish(processed)
  ) {
    // この時点で処理済みのテキストを返す（後で非同期で変換処理を完了する）
    return processed
  }

  // 変換不要な場合はそのまま返す
  return processed
}

async function synthesizeVoice(
  talk: Talk,
  voiceType: AIVoice
): Promise<ArrayBuffer | null> {
  const ss = settingsStore.getState()

  if (ss.audioMode) {
    return null
  }

  try {
    switch (voiceType) {
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
          ss.voicevoxIntonation,
          ss.voicevoxServerUrl
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
          ss.aivisSpeechIntonationScale,
          ss.aivisSpeechServerUrl,
          ss.aivisSpeechTempoDynamics,
          ss.aivisSpeechPrePhonemeLength,
          ss.aivisSpeechPostPhonemeLength
        )
      case 'aivis_cloud_api':
        return await synthesizeVoiceAivisCloudApi(
          talk,
          ss.aivisCloudApiKey,
          ss.aivisCloudModelUuid,
          ss.aivisCloudStyleId,
          ss.aivisCloudStyleName,
          ss.aivisCloudUseStyleName,
          ss.aivisCloudSpeed,
          ss.aivisCloudPitch,
          ss.aivisCloudIntonationScale,
          ss.aivisCloudTempoDynamics,
          ss.aivisCloudPrePhonemeLength,
          ss.aivisCloudPostPhonemeLength
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
      case 'cartesia':
        return await synthesizeVoiceCartesiaApi(
          talk,
          ss.cartesiaApiKey,
          ss.cartesiaVoiceId,
          ss.selectLanguage
        )
      case 'openai':
        return await synthesizeVoiceOpenAIApi(
          talk,
          ss.openaiKey,
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
      default:
        return null
    }
  } catch (error) {
    handleTTSError(error, voiceType)
    return null
  }
}

const createSpeakCharacter = () => {
  let lastSynthesisStartAt = 0
  let currentSessionId: string | null = null
  let nextSynthesisOrder = 0
  let nextEnqueueOrder = 0
  const pendingResults = new Map<number, PendingSpeakResult>()

  const resetPendingResults = (sessionId: string) => {
    pendingResults.forEach((result) => {
      disposeSynthesizedSpeech(result.audio, result.onComplete)
    })
    pendingResults.clear()
    currentSessionId = sessionId
    nextSynthesisOrder = 0
    nextEnqueueOrder = 0
    lastSynthesisStartAt = 0
  }

  const flushPendingResults = () => {
    while (pendingResults.has(nextEnqueueOrder)) {
      const result = pendingResults.get(nextEnqueueOrder)
      pendingResults.delete(nextEnqueueOrder)
      nextEnqueueOrder += 1

      if (!result) {
        continue
      }

      if (!result.audio) {
        result.onComplete?.()
        continue
      }

      if (result.tokenAtStart !== SpeakQueue.currentStopToken) {
        disposeSynthesizedSpeech(result.audio, result.onComplete)
        continue
      }

      void speakQueue.addTask({
        sessionId: result.sessionId,
        talk: result.talk,
        displayText: result.displayText,
        ...result.audio,
        onPlaybackStart: () => {
          markConversationLatency(result.sessionId, 'playback_started')
          result.onPlaybackStart?.()
        },
        onComplete: result.onComplete,
      })
    }
  }

  return (
    sessionId: string,
    talk: Talk,
    onStart?: () => void,
    onComplete?: () => void,
    displayText?: string,
    onPlaybackStart?: () => void
  ) => {
    let called = false
    const ss = settingsStore.getState()
    onStart?.()

    const initialToken = SpeakQueue.currentStopToken

    speakQueue.checkSessionId(sessionId)
    if (currentSessionId !== sessionId) {
      resetPendingResults(sessionId)
    }

    // 停止後なら即完了
    if (SpeakQueue.currentStopToken !== initialToken) {
      if (onComplete && !called) {
        called = true
        onComplete()
      }
      return
    }

    const processedMessage = preprocessMessage(talk.message, ss)
    if (!processedMessage && !talk.buffer) {
      if (onComplete && !called) {
        called = true
        onComplete()
      }
      return
    }

    if (processedMessage) {
      talk.message = processedMessage
    } else if (talk.buffer) {
      talk.message = ''
    }

    const guardedOnComplete = () => {
      if (onComplete && !called) {
        called = true
        onComplete()
      }
    }

    let isNeedDecode = true
    const synthesisOrder = nextSynthesisOrder++

    const processAndSynthesizePromise = (async () => {
      // TTS APIの瞬間的な連打は避けつつ、合成自体は並列で進める。
      const scheduledStartAt = Math.max(
        Date.now(),
        lastSynthesisStartAt + SYNTHESIS_START_GAP_MS
      )
      lastSynthesisStartAt = scheduledStartAt
      const waitTime = scheduledStartAt - Date.now()
      if (waitTime > 0) {
        await wait(waitTime)
      }

      // ボタン停止でキャンセルされた場合はここで終了
      if (SpeakQueue.currentStopToken !== initialToken) {
        return null
      }

      if (
        processedMessage &&
        ss.changeEnglishToJapanese &&
        ss.selectLanguage === 'ja' &&
        containsEnglish(processedMessage)
      ) {
        try {
          const convertedText =
            await asyncConvertEnglishToJapaneseReading(processedMessage)
          talk.message = convertedText
        } catch (error) {
          logger.error('Error converting English to Japanese:', error)
        }
      }

      let audio: SynthesizedSpeech | null
      try {
        if (talk.message == '' && talk.buffer) {
          audio = {
            kind: 'buffer',
            audioBuffer: talk.buffer,
            isNeedDecode: false,
          }
          isNeedDecode = false
        } else if (talk.message !== '') {
          markConversationLatency(sessionId, 'tts_request_started')
          if (
            ss.selectVoice === 'elevenlabs' &&
            getCharacterRenderer()?.speakPcm16Stream
          ) {
            const streamed = await synthesizeVoiceElevenlabsStreamApi(
              talk,
              ss.elevenlabsApiKey,
              ss.elevenlabsVoiceId,
              ss.selectLanguage,
              () => markConversationLatency(sessionId, 'first_audio_chunk')
            )
            audio = {
              kind: 'pcm16-stream',
              audioStream: streamed.stream,
              sampleRate: streamed.sampleRate,
            }
          } else if (
            ss.selectVoice === 'openai' &&
            getCharacterRenderer()?.speakPcm16Stream
          ) {
            const streamed = await synthesizeVoiceOpenAIStreamApi(
              talk,
              ss.openaiKey,
              ss.openaiTTSVoice,
              ss.openaiTTSModel,
              ss.openaiTTSSpeed,
              () => markConversationLatency(sessionId, 'first_audio_chunk')
            )
            audio = {
              kind: 'pcm16-stream',
              audioStream: streamed.stream,
              sampleRate: streamed.sampleRate,
            }
          } else {
            const buffer = await synthesizeVoice(talk, ss.selectVoice)
            audio = buffer
              ? { kind: 'buffer', audioBuffer: buffer, isNeedDecode }
              : null
          }
          markConversationLatency(sessionId, 'tts_ready')
        } else {
          audio = null
        }
      } catch (error) {
        handleTTSError(error, ss.selectVoice)
        return null
      }

      return {
        sessionId,
        audio,
        talk,
        displayText,
        onPlaybackStart,
        onComplete: guardedOnComplete,
        tokenAtStart: initialToken,
      }
    })()

    processAndSynthesizePromise
      .then((result) => {
        if (currentSessionId !== sessionId) {
          disposeSynthesizedSpeech(result?.audio, guardedOnComplete)
          return
        }

        pendingResults.set(synthesisOrder, {
          sessionId,
          audio: result?.audio ?? null,
          talk,
          displayText,
          onPlaybackStart,
          onComplete: guardedOnComplete,
          tokenAtStart: result?.tokenAtStart ?? initialToken,
        })
        flushPendingResults()
      })
      .catch((error) => {
        logger.error('Error in processAndSynthesizePromise chain:', error)
        if (currentSessionId !== sessionId) {
          guardedOnComplete()
          return
        }
        pendingResults.set(synthesisOrder, {
          sessionId,
          audio: null,
          talk,
          onPlaybackStart,
          onComplete: guardedOnComplete,
          tokenAtStart: initialToken,
        })
        flushPendingResults()
      })
  }
}

export function handleTTSError(error: unknown, serviceName: string): void {
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

  logger.error(errorMessage)
}

export const speakCharacter = createSpeakCharacter()

export const testVoiceVox = async (customText?: string) => {
  await testVoice('voicevox', customText)
}

export const testAivisSpeech = async (customText?: string) => {
  await testVoice('aivis_speech', customText)
}

export const testVoice = async (voiceType: AIVoice, customText?: string) => {
  const ss = settingsStore.getState()

  const defaultMessages: Record<AIVoice, string> = {
    voicevox: 'ボイスボックスを使用します',
    aivis_speech: 'AivisSpeechを使用します',
    aivis_cloud_api: 'Aivis Cloud APIを使用します',
    koeiromap: 'コエイロマップを使用します',
    google: 'Google Text-to-Speechを使用します',
    stylebertvits2: 'StyleBertVITS2を使用します',
    gsvitts: 'GSVI TTSを使用します',
    elevenlabs: 'ElevenLabsを使用します',
    cartesia: 'Cartesiaを使用します',
    openai: 'OpenAI TTSを使用します',
    azure: 'Azure TTSを使用します',
  }

  const message = customText || defaultMessages[voiceType]

  const talk: Talk = {
    message,
    emotion: 'neutral',
  }

  try {
    const currentVoice = ss.selectVoice
    settingsStore.setState({ selectVoice: voiceType })

    const buffer = await synthesizeVoice(talk, voiceType)

    settingsStore.setState({ selectVoice: currentVoice })

    if (buffer) {
      await getCharacterRenderer()?.speak(buffer, talk)
    }
  } catch (error) {
    logger.error(`Error testing ${voiceType} voice:`, error)
    handleTTSError(error, voiceType)
  }
}
