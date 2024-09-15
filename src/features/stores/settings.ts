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
}

interface Character {
  characterName: string
  showAssistantText: boolean
  showCharacterName: boolean
  systemPrompt: string
  conversationContinuityMode: boolean
}

interface General {
  selectLanguage: Language
  selectVoiceLanguage: VoiceLanguage
  changeEnglishToJapanese: boolean
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
      koeiromapKey: '',
      youtubeApiKey: '',
      elevenlabsApiKey: '',

      // Model Provider
      selectAIService: 'openai',
      selectAIModel: 'gpt-4o',
      localLlmUrl: '',
      selectVoice: 'voicevox',
      koeiroParam: DEFAULT_PARAM,
      googleTtsType:
        process.env.NEXT_PUBLIC_GOOGLE_TTS_TYPE || 'en-US-Neural2-F',
      voicevoxSpeaker: '46',
      voicevoxSpeed: 1.0,
      voicevoxPitch: 0.0,
      voicevoxIntonation: 1.0,
      stylebertvits2ServerUrl: 'http://127.0.0.1:5000',
      stylebertvits2ApiKey: '',
      stylebertvits2ModelId: '0',
      stylebertvits2Style: 'Neutral',
      gsviTtsServerUrl:
        process.env.NEXT_PUBLIC_LOCAL_TTS_URL || 'http://127.0.0.1:5000/tts',
      gsviTtsModelId: '',
      gsviTtsBatchSize: 2,
      gsviTtsSpeechRate: 1.0,
      elevenlabsVoiceId: '',

      // Integrations
      difyUrl: '',
      difyConversationId: '',
      youtubeMode: false,
      youtubeLiveId: '',
      youtubePlaying: false,
      youtubeNextPageToken: '',
      youtubeContinuationCount: 0,
      youtubeNoCommentCount: 0,
      youtubeSleepMode: false,

      // Character
      characterName: 'CHARACTER',
      showAssistantText: true,
      showCharacterName: true,
      systemPrompt: SYSTEM_PROMPT,
      conversationContinuityMode: false,

      // General
      selectLanguage: 'ja',
      selectVoiceLanguage: 'ja-JP', // TODO: 要整理, ja-JP, en-US
      changeEnglishToJapanese: false,
      webSocketMode: false,
      slideMode: false,
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
        gsviTtsServerUrl: state.gsviTtsServerUrl,
        gsviTtsModelId: state.gsviTtsModelId,
        gsviTtsBatchSize: state.gsviTtsBatchSize,
        gsviTtsSpeechRate: state.gsviTtsSpeechRate,
        elevenlabsVoiceId: state.elevenlabsVoiceId,
        difyUrl: state.difyUrl,
        difyConversationId: state.difyConversationId,
        youtubeMode: state.youtubeMode,
        youtubeLiveId: state.youtubeLiveId,
        characterName: state.characterName,
        showAssistantText: state.showAssistantText,
        showCharacterName: state.showCharacterName,
        systemPrompt: state.systemPrompt,
        conversationContinuityMode: state.conversationContinuityMode,
        selectLanguage: state.selectLanguage,
        selectVoiceLanguage: state.selectVoiceLanguage,
        changeEnglishToJapanese: state.changeEnglishToJapanese,
        webSocketMode: state.webSocketMode,
        slideMode: state.slideMode,
      }),
    }
  )
)
export default settingsStore
