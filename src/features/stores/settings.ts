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

interface APIKeys {
  openAiKey: string
  anthropicKey: string
  googleKey: string
  groqKey: string
  difyKey: string
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
  stylebertvits2ServerUrl: string
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
}

interface Character {
  characterName: string
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
  ModelProvider &
  Integrations &
  Character &
  General

const settingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // API Keys
      openAiKey: '',
      anthropicKey: '',
      googleKey: '',
      groqKey: '',
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
      voicevoxSpeaker: '2',
      stylebertvits2ServerUrl: 'http://127.0.0.1:5000',
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

      // Character
      characterName: 'CHARACTER',
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
    }
  )
)
export default settingsStore
