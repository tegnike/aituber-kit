import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { KoeiroParam, DEFAULT_PARAM } from '@/features/constants/koeiroParam'
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants'
import {
  AIService,
  AIVoice,
  Language,
  OpenAITTSVoice,
  OpenAITTSModel,
  RealtimeAPIModeContentType,
  RealtimeAPIModeVoice,
  RealtimeAPIModeAzureVoice,
  AudioModeInputType,
  SpeechRecognitionMode,
  WhisperTranscriptionModel,
} from '../constants/settings'
import { googleSearchGroundingModels } from '../constants/aiModels'

export const multiModalAIServices = [
  'openai',
  'anthropic',
  'google',
  'azure',
] as const
export type multiModalAIServiceKey = (typeof multiModalAIServices)[number]

export type googleSearchGroundingModelKey =
  (typeof googleSearchGroundingModels)[number]

type multiModalAPIKeys = {
  [K in multiModalAIServiceKey as `${K}Key`]: string
}

interface APIKeys {
  openaiKey: string
  anthropicKey: string
  googleKey: string
  azureKey: string
  xaiKey: string
  groqKey: string
  difyKey: string
  cohereKey: string
  mistralaiKey: string
  perplexityKey: string
  fireworksKey: string
  deepseekKey: string
  openrouterKey: string
  koeiromapKey: string
  youtubeApiKey: string
  elevenlabsApiKey: string
  azureEndpoint: string
  azureTTSKey: string
  azureTTSEndpoint: string
  customApiUrl: string
  customApiHeaders: string
  customApiBody: string
  customApiStream: boolean
  includeSystemMessagesInCustomApi: boolean
}

interface Live2DSettings {
  neutralEmotions: string[]
  happyEmotions: string[]
  sadEmotions: string[]
  angryEmotions: string[]
  relaxedEmotions: string[]
  surprisedEmotions: string[]
  idleMotionGroup: string
  neutralMotionGroup: string
  happyMotionGroup: string
  sadMotionGroup: string
  angryMotionGroup: string
  relaxedMotionGroup: string
  surprisedMotionGroup: string
}

interface ModelProvider extends Live2DSettings {
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
  voicevoxServerUrl: string
  aivisSpeechSpeaker: string
  aivisSpeechSpeed: number
  aivisSpeechPitch: number
  aivisSpeechIntonation: number
  aivisSpeechServerUrl: string
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
  openaiTTSVoice: OpenAITTSVoice
  openaiTTSModel: OpenAITTSModel
  openaiTTSSpeed: number
  nijivoiceApiKey: string
  nijivoiceActorId: string
  nijivoiceSpeed: number
  nijivoiceEmotionalLevel: number
  nijivoiceSoundDuration: number
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
  characterPreset1: string
  characterPreset2: string
  characterPreset3: string
  characterPreset4: string
  characterPreset5: string
  customPresetName1: string
  customPresetName2: string
  customPresetName3: string
  customPresetName4: string
  customPresetName5: string
  selectedPresetIndex: number
  showAssistantText: boolean
  showCharacterName: boolean
  systemPrompt: string
  selectedVrmPath: string
  selectedLive2DPath: string
}

// Preset question type
export interface PresetQuestion {
  id: string
  text: string
  order: number
}

interface General {
  selectLanguage: Language
  changeEnglishToJapanese: boolean
  includeTimestampInUserMessage: boolean
  showControlPanel: boolean
  showCharacterPresetMenu: boolean
  externalLinkageMode: boolean
  realtimeAPIMode: boolean
  realtimeAPIModeContentType: RealtimeAPIModeContentType
  realtimeAPIModeVoice: RealtimeAPIModeVoice | RealtimeAPIModeAzureVoice
  audioMode: boolean
  audioModeInputType: AudioModeInputType
  audioModeVoice: OpenAITTSVoice
  slideMode: boolean
  messageReceiverEnabled: boolean
  clientId: string
  useSearchGrounding: boolean
  dynamicRetrievalThreshold: number
  maxPastMessages: number
  useVideoAsBackground: boolean
  temperature: number
  maxTokens: number
  noSpeechTimeout: number
  showSilenceProgressBar: boolean
  continuousMicListeningMode: boolean
  presetQuestions: PresetQuestion[]
  showPresetQuestions: boolean
  speechRecognitionMode: SpeechRecognitionMode
  whisperTranscriptionModel: WhisperTranscriptionModel
  initialSpeechTimeout: number
  chatLogWidth: number
}

interface ModelType {
  modelType: 'vrm' | 'live2d'
}

export type SettingsState = APIKeys &
  multiModalAPIKeys &
  ModelProvider &
  Integrations &
  Character &
  General &
  ModelType

const settingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // API Keys
      openaiKey:
        process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
        process.env.NEXT_PUBLIC_OPENAI_KEY ||
        '',
      anthropicKey: '',
      googleKey: '',
      azureKey:
        process.env.NEXT_PUBLIC_AZURE_API_KEY ||
        process.env.NEXT_PUBLIC_AZURE_KEY ||
        '',
      xaiKey: '',
      groqKey: '',
      cohereKey: '',
      mistralaiKey: '',
      perplexityKey: '',
      fireworksKey: '',
      difyKey: '',
      deepseekKey: '',
      openrouterKey: '',
      koeiromapKey: process.env.NEXT_PUBLIC_KOEIROMAP_KEY || '',
      youtubeApiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '',
      elevenlabsApiKey: '',
      azureEndpoint: process.env.NEXT_PUBLIC_AZURE_ENDPOINT || '',

      // Model Provider
      selectAIService:
        (process.env.NEXT_PUBLIC_SELECT_AI_SERVICE as AIService) || 'openai',
      selectAIModel: process.env.NEXT_PUBLIC_SELECT_AI_MODEL || 'gpt-4',
      localLlmUrl: process.env.NEXT_PUBLIC_LOCAL_LLM_URL || '',
      selectVoice:
        (process.env.NEXT_PUBLIC_SELECT_VOICE as AIVoice) || 'voicevox',
      koeiroParam: DEFAULT_PARAM,
      googleTtsType: process.env.NEXT_PUBLIC_GOOGLE_TTS_TYPE || '',
      voicevoxSpeaker: process.env.NEXT_PUBLIC_VOICEVOX_SPEAKER || '46',
      voicevoxSpeed:
        parseFloat(process.env.NEXT_PUBLIC_VOICEVOX_SPEED || '1.0') || 1.0,
      voicevoxPitch:
        parseFloat(process.env.NEXT_PUBLIC_VOICEVOX_PITCH || '0.0') || 0.0,
      voicevoxIntonation:
        parseFloat(process.env.NEXT_PUBLIC_VOICEVOX_INTONATION || '1.0') || 1.0,
      voicevoxServerUrl: '',
      aivisSpeechSpeaker:
        process.env.NEXT_PUBLIC_AIVIS_SPEECH_SPEAKER || '888753760',
      aivisSpeechSpeed:
        parseFloat(process.env.NEXT_PUBLIC_AIVIS_SPEECH_SPEED || '1.0') || 1.0,
      aivisSpeechPitch:
        parseFloat(process.env.NEXT_PUBLIC_AIVIS_SPEECH_PITCH || '0.0') || 0.0,
      aivisSpeechIntonation:
        parseFloat(process.env.NEXT_PUBLIC_AIVIS_SPEECH_INTONATION || '1.0') ||
        1.0,
      aivisSpeechServerUrl: '',
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
      openaiTTSVoice:
        (process.env.NEXT_PUBLIC_OPENAI_TTS_VOICE as OpenAITTSVoice) ||
        'shimmer',
      openaiTTSModel:
        (process.env.NEXT_PUBLIC_OPENAI_TTS_MODEL as OpenAITTSModel) || 'tts-1',
      openaiTTSSpeed:
        parseFloat(process.env.NEXT_PUBLIC_OPENAI_TTS_SPEED || '1.0') || 1.0,
      azureTTSKey: '',
      azureTTSEndpoint: '',
      customApiUrl: process.env.NEXT_PUBLIC_CUSTOM_API_URL || '',
      customApiHeaders: process.env.NEXT_PUBLIC_CUSTOM_API_HEADERS || '{}',
      customApiBody: process.env.NEXT_PUBLIC_CUSTOM_API_BODY || '{}',
      customApiStream: true,
      includeSystemMessagesInCustomApi:
        process.env.NEXT_PUBLIC_INCLUDE_SYSTEM_MESSAGES_IN_CUSTOM_API !==
        'false',

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
      characterPreset1:
        process.env.NEXT_PUBLIC_CHARACTER_PRESET1 || SYSTEM_PROMPT,
      characterPreset2:
        process.env.NEXT_PUBLIC_CHARACTER_PRESET2 || SYSTEM_PROMPT,
      characterPreset3:
        process.env.NEXT_PUBLIC_CHARACTER_PRESET3 || SYSTEM_PROMPT,
      characterPreset4:
        process.env.NEXT_PUBLIC_CHARACTER_PRESET4 || SYSTEM_PROMPT,
      characterPreset5:
        process.env.NEXT_PUBLIC_CHARACTER_PRESET5 || SYSTEM_PROMPT,
      customPresetName1:
        process.env.NEXT_PUBLIC_CUSTOM_PRESET_NAME1 || 'Preset 1',
      customPresetName2:
        process.env.NEXT_PUBLIC_CUSTOM_PRESET_NAME2 || 'Preset 2',
      customPresetName3:
        process.env.NEXT_PUBLIC_CUSTOM_PRESET_NAME3 || 'Preset 3',
      customPresetName4:
        process.env.NEXT_PUBLIC_CUSTOM_PRESET_NAME4 || 'Preset 4',
      customPresetName5:
        process.env.NEXT_PUBLIC_CUSTOM_PRESET_NAME5 || 'Preset 5',
      selectedPresetIndex: 0,
      showAssistantText:
        process.env.NEXT_PUBLIC_SHOW_ASSISTANT_TEXT === 'true' ? true : false,
      showCharacterName:
        process.env.NEXT_PUBLIC_SHOW_CHARACTER_NAME === 'true' ? true : false,
      systemPrompt:
        process.env.NEXT_PUBLIC_SYSTEM_PROMPT ||
        process.env.NEXT_PUBLIC_CHARACTER_PRESET1 ||
        SYSTEM_PROMPT,
      selectedVrmPath:
        process.env.NEXT_PUBLIC_SELECTED_VRM_PATH || '/vrm/nikechan_v1.vrm',
      selectedLive2DPath:
        process.env.NEXT_PUBLIC_SELECTED_LIVE2D_PATH ||
        '/live2d/nike01/nike01.model3.json',

      // General
      selectLanguage:
        (process.env.NEXT_PUBLIC_SELECT_LANGUAGE as Language) || 'ja',
      changeEnglishToJapanese:
        process.env.NEXT_PUBLIC_CHANGE_ENGLISH_TO_JAPANESE === 'true',
      includeTimestampInUserMessage:
        process.env.NEXT_PUBLIC_INCLUDE_TIMESTAMP_IN_USER_MESSAGE === 'true',
      showControlPanel: process.env.NEXT_PUBLIC_SHOW_CONTROL_PANEL !== 'false',
      showCharacterPresetMenu:
        process.env.NEXT_PUBLIC_SHOW_CHARACTER_PRESET_MENU === 'true',
      externalLinkageMode:
        process.env.NEXT_PUBLIC_EXTERNAL_LINKAGE_MODE === 'true',
      realtimeAPIMode:
        (process.env.NEXT_PUBLIC_REALTIME_API_MODE === 'true' &&
          ['openai', 'azure'].includes(
            process.env.NEXT_PUBLIC_SELECT_AI_SERVICE as AIService
          )) ||
        false,
      realtimeAPIModeContentType:
        (process.env
          .NEXT_PUBLIC_REALTIME_API_MODE_CONTENT_TYPE as RealtimeAPIModeContentType) ||
        'input_text',
      realtimeAPIModeVoice:
        (process.env
          .NEXT_PUBLIC_REALTIME_API_MODE_VOICE as RealtimeAPIModeVoice) ||
        'shimmer',
      audioMode: process.env.NEXT_PUBLIC_AUDIO_MODE === 'true',
      audioModeInputType:
        (process.env.NEXT_PUBLIC_AUDIO_MODE_INPUT_TYPE as AudioModeInputType) ||
        'input_text',
      audioModeVoice:
        (process.env.NEXT_PUBLIC_AUDIO_MODE_VOICE as OpenAITTSVoice) ||
        'shimmer',
      slideMode: process.env.NEXT_PUBLIC_SLIDE_MODE === 'true',
      messageReceiverEnabled:
        process.env.NEXT_PUBLIC_MESSAGE_RECEIVER_ENABLED === 'true',
      clientId: '',
      useSearchGrounding:
        process.env.NEXT_PUBLIC_USE_SEARCH_GROUNDING === 'true',
      dynamicRetrievalThreshold: 0.3,
      maxPastMessages:
        parseInt(process.env.NEXT_PUBLIC_MAX_PAST_MESSAGES || '10') || 10,
      useVideoAsBackground:
        process.env.NEXT_PUBLIC_USE_VIDEO_AS_BACKGROUND === 'true',
      temperature:
        parseFloat(process.env.NEXT_PUBLIC_TEMPERATURE || '1.0') || 1.0,
      maxTokens: parseInt(process.env.NEXT_PUBLIC_MAX_TOKENS || '4096') || 4096,
      noSpeechTimeout:
        parseFloat(process.env.NEXT_PUBLIC_NO_SPEECH_TIMEOUT || '5.0') || 5.0,
      showSilenceProgressBar:
        process.env.NEXT_PUBLIC_SHOW_SILENCE_PROGRESS_BAR === 'true',
      continuousMicListeningMode:
        process.env.NEXT_PUBLIC_CONTINUOUS_MIC_LISTENING_MODE === 'true',
      presetQuestions: (
        process.env.NEXT_PUBLIC_PRESET_QUESTIONS?.split(',') || []
      ).map((text, index) => ({
        id: `preset-question-${index}`,
        text: text.trim(),
        order: index,
      })),
      showPresetQuestions:
        process.env.NEXT_PUBLIC_SHOW_PRESET_QUESTIONS !== 'false',
      speechRecognitionMode:
        (process.env
          .NEXT_PUBLIC_SPEECH_RECOGNITION_MODE as SpeechRecognitionMode) ||
        'browser',
      whisperTranscriptionModel:
        (process.env
          .NEXT_PUBLIC_WHISPER_TRANSCRIPTION_MODEL as WhisperTranscriptionModel) ||
        'whisper-1',
      initialSpeechTimeout:
        parseFloat(process.env.NEXT_PUBLIC_INITIAL_SPEECH_TIMEOUT || '5.0') ||
        5.0,
      chatLogWidth:
        parseFloat(process.env.NEXT_PUBLIC_CHAT_LOG_WIDTH || '400') || 400,

      // NijiVoice settings
      nijivoiceApiKey: '',
      nijivoiceActorId: process.env.NEXT_PUBLIC_NIJIVOICE_ACTOR_ID || '',
      nijivoiceSpeed:
        parseFloat(process.env.NEXT_PUBLIC_NIJIVOICE_SPEED || '1.0') || 1.0,
      nijivoiceEmotionalLevel:
        parseFloat(
          process.env.NEXT_PUBLIC_NIJIVOICE_EMOTIONAL_LEVEL || '0.1'
        ) || 0.1,
      nijivoiceSoundDuration:
        parseFloat(process.env.NEXT_PUBLIC_NIJIVOICE_SOUND_DURATION || '0.1') ||
        0.1,

      // Settings
      modelType:
        (process.env.NEXT_PUBLIC_MODEL_TYPE as 'vrm' | 'live2d') || 'vrm',

      // Live2D settings
      neutralEmotions:
        process.env.NEXT_PUBLIC_NEUTRAL_EMOTIONS?.split(',') || [],
      happyEmotions: process.env.NEXT_PUBLIC_HAPPY_EMOTIONS?.split(',') || [],
      sadEmotions: process.env.NEXT_PUBLIC_SAD_EMOTIONS?.split(',') || [],
      angryEmotions: process.env.NEXT_PUBLIC_ANGRY_EMOTIONS?.split(',') || [],
      relaxedEmotions:
        process.env.NEXT_PUBLIC_RELAXED_EMOTIONS?.split(',') || [],
      surprisedEmotions:
        process.env.NEXT_PUBLIC_SURPRISED_EMOTIONS?.split(',') || [],
      idleMotionGroup: process.env.NEXT_PUBLIC_IDLE_MOTION_GROUP || '',
      neutralMotionGroup: process.env.NEXT_PUBLIC_NEUTRAL_MOTION_GROUP || '',
      happyMotionGroup: process.env.NEXT_PUBLIC_HAPPY_MOTION_GROUP || '',
      sadMotionGroup: process.env.NEXT_PUBLIC_SAD_MOTION_GROUP || '',
      angryMotionGroup: process.env.NEXT_PUBLIC_ANGRY_MOTION_GROUP || '',
      relaxedMotionGroup: process.env.NEXT_PUBLIC_RELAXED_MOTION_GROUP || '',
      surprisedMotionGroup:
        process.env.NEXT_PUBLIC_SURPRISED_MOTION_GROUP || '',
    }),
    {
      name: 'aitube-kit-settings',
      partialize: (state) => ({
        openaiKey: state.openaiKey,
        anthropicKey: state.anthropicKey,
        googleKey: state.googleKey,
        azureKey: state.azureKey,
        xaiKey: state.xaiKey,
        groqKey: state.groqKey,
        cohereKey: state.cohereKey,
        mistralaiKey: state.mistralaiKey,
        perplexityKey: state.perplexityKey,
        fireworksKey: state.fireworksKey,
        difyKey: state.difyKey,
        deepseekKey: state.deepseekKey,
        openrouterKey: state.openrouterKey,
        koeiromapKey: state.koeiromapKey,
        youtubeApiKey: state.youtubeApiKey,
        elevenlabsApiKey: state.elevenlabsApiKey,
        azureEndpoint: state.azureEndpoint,
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
        voicevoxServerUrl: state.voicevoxServerUrl,
        aivisSpeechSpeaker: state.aivisSpeechSpeaker,
        aivisSpeechSpeed: state.aivisSpeechSpeed,
        aivisSpeechPitch: state.aivisSpeechPitch,
        aivisSpeechIntonation: state.aivisSpeechIntonation,
        aivisSpeechServerUrl: state.aivisSpeechServerUrl,
        stylebertvits2ServerUrl: state.stylebertvits2ServerUrl,
        stylebertvits2ModelId: state.stylebertvits2ModelId,
        stylebertvits2ApiKey: state.stylebertvits2ApiKey,
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
        characterPreset1: state.characterPreset1,
        characterPreset2: state.characterPreset2,
        characterPreset3: state.characterPreset3,
        characterPreset4: state.characterPreset4,
        characterPreset5: state.characterPreset5,
        customPresetName1: state.customPresetName1,
        customPresetName2: state.customPresetName2,
        customPresetName3: state.customPresetName3,
        customPresetName4: state.customPresetName4,
        customPresetName5: state.customPresetName5,
        selectedPresetIndex: state.selectedPresetIndex,
        showAssistantText: state.showAssistantText,
        showCharacterName: state.showCharacterName,
        systemPrompt: state.systemPrompt,
        selectLanguage: state.selectLanguage,
        changeEnglishToJapanese: state.changeEnglishToJapanese,
        includeTimestampInUserMessage: state.includeTimestampInUserMessage,
        externalLinkageMode: state.externalLinkageMode,
        realtimeAPIMode: state.realtimeAPIMode,
        realtimeAPIModeContentType: state.realtimeAPIModeContentType,
        realtimeAPIModeVoice: state.realtimeAPIModeVoice,
        audioMode: state.audioMode,
        audioModeInputType: state.audioModeInputType,
        audioModeVoice: state.audioModeVoice,
        messageReceiverEnabled: state.messageReceiverEnabled,
        clientId: state.clientId,
        useSearchGrounding: state.useSearchGrounding,
        openaiTTSVoice: state.openaiTTSVoice,
        openaiTTSModel: state.openaiTTSModel,
        openaiTTSSpeed: state.openaiTTSSpeed,
        azureTTSKey: state.azureTTSKey,
        azureTTSEndpoint: state.azureTTSEndpoint,
        selectedVrmPath: state.selectedVrmPath,
        selectedLive2DPath: state.selectedLive2DPath,
        nijivoiceApiKey: state.nijivoiceApiKey,
        nijivoiceActorId: state.nijivoiceActorId,
        nijivoiceSpeed: state.nijivoiceSpeed,
        nijivoiceEmotionalLevel: state.nijivoiceEmotionalLevel,
        nijivoiceSoundDuration: state.nijivoiceSoundDuration,
        modelType: state.modelType,
        neutralEmotions: state.neutralEmotions,
        happyEmotions: state.happyEmotions,
        sadEmotions: state.sadEmotions,
        angryEmotions: state.angryEmotions,
        relaxedEmotions: state.relaxedEmotions,
        surprisedEmotions: state.surprisedEmotions,
        idleMotionGroup: state.idleMotionGroup,
        neutralMotionGroup: state.neutralMotionGroup,
        happyMotionGroup: state.happyMotionGroup,
        sadMotionGroup: state.sadMotionGroup,
        angryMotionGroup: state.angryMotionGroup,
        relaxedMotionGroup: state.relaxedMotionGroup,
        surprisedMotionGroup: state.surprisedMotionGroup,
        maxPastMessages: state.maxPastMessages,
        useVideoAsBackground: state.useVideoAsBackground,
        showCharacterPresetMenu: state.showCharacterPresetMenu,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        noSpeechTimeout: state.noSpeechTimeout,
        showSilenceProgressBar: state.showSilenceProgressBar,
        continuousMicListeningMode: state.continuousMicListeningMode,
        presetQuestions: state.presetQuestions,
        showPresetQuestions: state.showPresetQuestions,
        speechRecognitionMode: state.speechRecognitionMode,
        whisperTranscriptionModel: state.whisperTranscriptionModel,
        customApiUrl: state.customApiUrl,
        customApiHeaders: state.customApiHeaders,
        customApiBody: state.customApiBody,
        customApiStream: state.customApiStream,
        includeSystemMessagesInCustomApi:
          state.includeSystemMessagesInCustomApi,
        initialSpeechTimeout: state.initialSpeechTimeout,
        chatLogWidth: state.chatLogWidth,
      }),
    }
  )
)

export default settingsStore
