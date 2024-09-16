import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { KoeiroParam, DEFAULT_PARAM } from '@/features/constants/koeiroParam'
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants'
import {
  AIService,
  AIVoice,
  Language,
  VoiceLanguage,
} from '../constants/settings'

export const multiModalAIServices = ['openai', 'anthropic', 'google'] as const
export type multiModalAIServiceKey = (typeof multiModalAIServices)[number]

type multiModalAPIKeys = {
  [K in multiModalAIServiceKey as `${K}Key`]: string
}

interface APIKeys {
  openaiKey: string
  anthropicKey: string
  googleKey: string
  azureKey: string
  groqKey: string
  difyKey: string
  cohereKey: string
  mistralaiKey: string
  perplexityKey: string
  fireworksKey: string
  koeiromapKey: string
  youtubeApiKey: string
  elevenlabsApiKey: string
}

interface ModelProvider {
  selectAIService: AIService
  selectAIModel: string
  localLlmUrl: string
  selectVoice: AIVoice
  koeiroParam: KoeiroParam
  googleTtsType: string
  voicevoxSpeaker: string
  voicevoxSpeed: number
  voicevoxPitch: number
  voicevoxIntonation: number
  stylebertvits2ServerUrl: string
  stylebertvits2ApiKey: string
  stylebertvits2ModelId: string
  stylebertvits2Style: string
  stylebertvits2SdpRatio: number
  stylebertvits2Length: number
  gsviTtsServerUrl: string
  gsviTtsModelId: string
  gsviTtsBatchSize: number
  gsviTtsSpeechRate: number
  elevenlabsVoiceId: string
}

interface Integrations {
  difyUrl: string
  difyConversationId: string
  youtubeMode: boolean
  youtubeLiveId: string
  youtubePlaying: boolean
  youtubeNextPageToken: string
  youtubeContinuationCount: number
  youtubeNoCommentCount: number
  youtubeSleepMode: boolean
  conversationContinuityMode: boolean
}

interface Character {
  characterName: string
  showAssistantText: boolean
  showCharacterName: boolean
  systemPrompt: string
}

interface General {
  selectLanguage: Language
  selectVoiceLanguage: VoiceLanguage
  changeEnglishToJapanese: boolean
  showControlPanel: boolean
  webSocketMode: boolean
  slideMode: boolean
}

export type SettingsState = APIKeys &
  multiModalAPIKeys &
  ModelProvider &
  Integrations &
  Character &
  General

const settingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // API Keys
      openaiKey: '',
      anthropicKey: '',
      googleKey: '',
      azureKey: '',
      groqKey: '',
      cohereKey: '',
      mistralaiKey: '',
      perplexityKey: '',
      fireworksKey: '',
      difyKey: '',
      koeiromapKey: process.env.NEXT_PUBLIC_KOEIROMAP_KEY || '',
      youtubeApiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '',
      elevenlabsApiKey: '',

      // Model Provider
      selectAIService:
        (process.env.NEXT_PUBLIC_SELECT_AI_SERVICE as AIService) || 'openai',
      selectAIModel: process.env.NEXT_PUBLIC_SELECT_AI_MODEL || 'gpt-4',
      localLlmUrl: process.env.NEXT_PUBLIC_LOCAL_LLM_URL || '',
      selectVoice:
        (process.env.NEXT_PUBLIC_SELECT_VOICE as AIVoice) || 'voicevox',
      koeiroParam: DEFAULT_PARAM,
      googleTtsType:
        process.env.NEXT_PUBLIC_GOOGLE_TTS_TYPE || 'en-US-Neural2-F',
      voicevoxSpeaker: process.env.NEXT_PUBLIC_VOICEVOX_SPEAKER || '46',
      voicevoxSpeed:
        parseFloat(process.env.NEXT_PUBLIC_VOICEVOX_SPEED || '1.0') || 1.0,
      voicevoxPitch:
        parseFloat(process.env.NEXT_PUBLIC_VOICEVOX_PITCH || '0.0') || 0.0,
      voicevoxIntonation:
        parseFloat(process.env.NEXT_PUBLIC_VOICEVOX_INTONATION || '1.0') || 1.0,
      stylebertvits2ServerUrl: '',
      stylebertvits2ModelId:
        process.env.NEXT_PUBLIC_STYLEBERTVITS2_MODEL_ID || '0',
      stylebertvits2ApiKey: '',
      stylebertvits2Style:
        process.env.NEXT_PUBLIC_STYLEBERTVITS2_STYLE || 'Neutral',
      stylebertvits2SdpRatio:
        parseFloat(process.env.NEXT_PUBLIC_STYLEBERTVITS2_SDP_RATIO || '0.2') ||
        0.2,
      stylebertvits2Length:
        parseFloat(process.env.NEXT_PUBLIC_STYLEBERTVITS2_LENGTH || '1.0') ||
        1.0,
      gsviTtsServerUrl:
        process.env.NEXT_PUBLIC_GSVI_TTS_URL || 'http://127.0.0.1:5000/tts',
      gsviTtsModelId: process.env.NEXT_PUBLIC_GSVI_TTS_MODEL_ID || '0',
      gsviTtsBatchSize:
        parseInt(process.env.NEXT_PUBLIC_GSVI_TTS_BATCH_SIZE || '2') || 2,
      gsviTtsSpeechRate:
        parseFloat(process.env.NEXT_PUBLIC_GSVI_TTS_SPEECH_RATE || '1.0') ||
        1.0,
      elevenlabsVoiceId: '',

      // Integrations
      difyUrl: '',
      difyConversationId: '',
      youtubeMode:
        process.env.NEXT_PUBLIC_YOUTUBE_MODE === 'true' ? true : false,
      youtubeLiveId: process.env.NEXT_PUBLIC_YOUTUBE_LIVE_ID || '',
      youtubePlaying: false,
      youtubeNextPageToken: '',
      youtubeContinuationCount: 0,
      youtubeNoCommentCount: 0,
      youtubeSleepMode: false,
      conversationContinuityMode: false,

      // Character
      characterName: process.env.NEXT_PUBLIC_CHARACTER_NAME || 'CHARACTER',
      showAssistantText:
        process.env.NEXT_PUBLIC_SHOW_ASSISTANT_TEXT === 'true' ? true : false,
      showCharacterName:
        process.env.NEXT_PUBLIC_SHOW_CHARACTER_NAME === 'true' ? true : false,
      systemPrompt: SYSTEM_PROMPT,

      // General
      selectLanguage:
        (process.env.NEXT_PUBLIC_SELECT_LANGUAGE as Language) || 'ja',
      selectVoiceLanguage:
        (process.env.NEXT_PUBLIC_SELECT_VOICE_LANGUAGE as VoiceLanguage) ||
        'ja-JP',
      changeEnglishToJapanese:
        process.env.NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE === 'true'
          ? true
          : false,
      showControlPanel:
        process.env.NEXT_PUBLIC_SHOW_CONTROL_PANEL === 'true'
          ? true
          : process.env.NEXT_PUBLIC_SHOW_CONTROL_PANEL === 'false'
            ? false
            : true,
      webSocketMode:
        process.env.NEXT_PUBLIC_WEB_SOCKET_MODE === 'true' ? true : false,
      slideMode: process.env.NEXT_PUBLIC_SLIDE_MODE === 'true' ? true : false,
    }),
    {
      name: 'aitube-kit-settings',
      partialize: (state) => ({
        openaiKey: state.openaiKey,
        anthropicKey: state.anthropicKey,
        googleKey: state.googleKey,
        azureKey: state.azureKey,
        groqKey: state.groqKey,
        cohereKey: state.cohereKey,
        mistralaiKey: state.mistralaiKey,
        perplexityKey: state.perplexityKey,
        fireworksKey: state.fireworksKey,
        difyKey: state.difyKey,
        koeiromapKey: state.koeiromapKey,
        youtubeApiKey: state.youtubeApiKey,
        elevenlabsApiKey: state.elevenlabsApiKey,
        selectAIService: state.selectAIService,
        selectAIModel: state.selectAIModel,
        localLlmUrl: state.localLlmUrl,
        selectVoice: state.selectVoice,
        koeiroParam: state.koeiroParam,
        googleTtsType: state.googleTtsType,
        voicevoxSpeaker: state.voicevoxSpeaker,
        voicevoxSpeed: state.voicevoxSpeed,
        voicevoxPitch: state.voicevoxPitch,
        voicevoxIntonation: state.voicevoxIntonation,
        stylebertvits2ServerUrl: state.stylebertvits2ServerUrl,
        stylebertvits2ApiKey: state.stylebertvits2ApiKey,
        stylebertvits2ModelId: state.stylebertvits2ModelId,
        stylebertvits2Style: state.stylebertvits2Style,
        stylebertvits2SdpRatio: state.stylebertvits2SdpRatio,
        stylebertvits2Length: state.stylebertvits2Length,
        gsviTtsServerUrl: state.gsviTtsServerUrl,
        gsviTtsModelId: state.gsviTtsModelId,
        gsviTtsBatchSize: state.gsviTtsBatchSize,
        gsviTtsSpeechRate: state.gsviTtsSpeechRate,
        elevenlabsVoiceId: state.elevenlabsVoiceId,
        difyUrl: state.difyUrl,
        difyConversationId: state.difyConversationId,
        youtubeLiveId: state.youtubeLiveId,
        characterName: state.characterName,
        showAssistantText: state.showAssistantText,
        showCharacterName: state.showCharacterName,
        systemPrompt: state.systemPrompt,
        selectLanguage: state.selectLanguage,
        selectVoiceLanguage: state.selectVoiceLanguage,
        changeEnglishToJapanese: state.changeEnglishToJapanese,
        webSocketMode: state.webSocketMode,
      }),
    }
  )
)
export default settingsStore
