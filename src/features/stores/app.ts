import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { KoeiroParam, DEFAULT_PARAM } from '@/features/constants/koeiroParam';
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants';
import { Message } from '@/features/messages/messages';
import { AIService } from '../chat/aiChatFactory';

// TODO: (7741) sync type definition with ui, if applicable

interface APIKeys {
  openAiKey: string;
  anthropicKey: string;
  googleKey: string;
  groqKey: string;
  difyKey: string;
  koeiromapKey: string;
  youtubeApiKey: string;
  elevenlabsApiKey: string;
}

interface ModelProviders {
  selectAIService: AIService;
  selectAIModel: string; // TODO: (7741) be more specific
  localLlmUrl: string;
  koeiroParam: KoeiroParam;
  googleTtsType: string;
  voicevoxSpeaker: string;
  stylebertvits2ServerUrl: string;
  stylebertvits2ModelId: string;
  stylebertvits2Style: string;
  gsviTtsServerUrl: string;
  gsviTtsModelId: string;
  gsviTtsBatchSize: number;
  gsviTtsSpeechRate: number;
  elevenlabsVoiceId: string;
}

interface Integrations {
  difyUrl: string;
  difyConversationId: string;
  youtubeLiveId: string;
}

// TODO: (7741) move out of store
type Voice =
  | 'elevenlabs'
  | 'google'
  | 'gsvitts'
  | 'koeiromap'
  | 'stylebertvits2'
  | 'voicevox';

interface Preferences {
  selectVoice: Voice;
  selectLanguage: 'JP'; // TODO: 要整理, JP, EN
  selectVoiceLanguage: 'ja-JP'; // TODO: 要整理, ja-JP, en-US
  youtubeMode: boolean;
  webSocketMode: boolean;
  changeEnglishToJapanese: boolean;
  conversationContinuityMode: boolean;
  characterName: string;
  showCharacterName: boolean;
}

interface Chat {
  systemPrompt: string;
  chatLog: Message[];
  codeLog: Message[];
}

interface GlobalStates {
  dontShowIntroduction: boolean;
}

export type AppState = APIKeys &
  ModelProviders &
  Integrations &
  Preferences &
  Chat &
  GlobalStates & {};

const store = create<AppState>()(
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

      // Model Providers
      selectAIService: 'openai',
      selectAIModel: 'gpt-3.5-turbo',
      localLlmUrl: '',
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
      youtubeLiveId: '',

      // Preferences
      selectVoice: 'voicevox',
      selectLanguage: 'JP',
      selectVoiceLanguage: 'ja-JP',
      youtubeMode: false,
      webSocketMode: false,
      changeEnglishToJapanese: false,
      conversationContinuityMode: false,
      characterName: 'CHARACTER',
      showCharacterName: true,

      // Chat
      systemPrompt: SYSTEM_PROMPT,
      chatLog: [],
      codeLog: [],

      // Global States
      dontShowIntroduction: false,
    }),
    {
      name: 'app',
    },
  ),
);
export default store;
