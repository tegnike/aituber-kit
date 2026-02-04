import type { SettingsState } from './settings'
import {
  defaultModels,
  isMultiModalModel,
  googleSearchGroundingModels,
  isReasoningModel,
  getReasoningEfforts,
} from '../constants/aiModels'
import type { AIService, AIVoice, ReasoningEffort } from '../constants/settings'

export interface CrossStoreEffect {
  store: 'menu' | 'home' | 'slide'
  state: Record<string, unknown>
}

export interface ExclusionRule {
  id: string
  description: string
  trigger: (
    incoming: Partial<SettingsState>,
    merged: SettingsState,
    prev: SettingsState
  ) => boolean
  apply: (merged: SettingsState) => Partial<SettingsState>
  crossStoreEffects?: (merged: SettingsState) => CrossStoreEffect[]
}

const wasSet = (incoming: Partial<SettingsState>, key: keyof SettingsState) =>
  key in incoming

const changed = (
  key: keyof SettingsState,
  prev: SettingsState,
  merged: SettingsState
) => prev[key] !== merged[key]

const JA_ONLY_VOICES: AIVoice[] = [
  'voicevox',
  'koeiromap',
  'aivis_speech',
  'aivis_cloud_api',
  'gsvitts',
]

export const exclusionRules: ExclusionRule[] = [
  // Rule 1: externalLinkageMode ON
  {
    id: 'externalLinkage-on',
    description:
      'externalLinkageMode ON時にconversationContinuityMode, realtimeAPIMode, audioModeをOFFにする',
    trigger: (_incoming, merged) => merged.externalLinkageMode === true,
    apply: () => ({
      conversationContinuityMode: false,
      realtimeAPIMode: false,
      audioMode: false,
    }),
  },

  // Rule 2: realtimeAPIMode ON
  {
    id: 'realtimeAPI-on',
    description:
      'realtimeAPIMode ON時にaudioMode OFF、speechRecognitionMode=browser、モデル変更、タイムアウトリセット',
    trigger: (_incoming, merged) => merged.realtimeAPIMode === true,
    apply: () => ({
      audioMode: false,
      speechRecognitionMode: 'browser' as const,
      selectAIModel: defaultModels.openaiRealtime,
      initialSpeechTimeout: 0,
      noSpeechTimeout: 0,
      showSilenceProgressBar: false,
      continuousMicListeningMode: false,
    }),
  },

  // Rule 3: audioMode ON
  {
    id: 'audioMode-on',
    description:
      'audioMode ON時にrealtimeAPIMode OFF、speechRecognitionMode=browser、モデル変更、タイムアウトリセット',
    trigger: (_incoming, merged) => merged.audioMode === true,
    apply: () => ({
      realtimeAPIMode: false,
      speechRecognitionMode: 'browser' as const,
      selectAIModel: defaultModels.openaiAudio,
      initialSpeechTimeout: 0,
      noSpeechTimeout: 0,
      showSilenceProgressBar: false,
      continuousMicListeningMode: false,
    }),
  },

  // Rule 4: realtimeAPIMode OFF (前値がON)
  // audioModeがONの場合はRule 3がモデルを設定するため、ここでは復元しない
  {
    id: 'realtimeAPI-off',
    description: 'realtimeAPIMode OFF時にモデルをデフォルトに復元',
    trigger: (incoming, merged, prev) =>
      wasSet(incoming, 'realtimeAPIMode') &&
      prev.realtimeAPIMode === true &&
      merged.realtimeAPIMode === false &&
      !merged.audioMode,
    apply: (merged) => ({
      selectAIModel: defaultModels[merged.selectAIService] || '',
    }),
  },

  // Rule 5: audioMode OFF (前値がON)
  // realtimeAPIModeがONの場合はRule 2がモデルを設定するため、ここでは復元しない
  {
    id: 'audioMode-off',
    description: 'audioMode OFF時にモデルをデフォルトに復元',
    trigger: (incoming, merged, prev) =>
      wasSet(incoming, 'audioMode') &&
      prev.audioMode === true &&
      merged.audioMode === false &&
      !merged.realtimeAPIMode,
    apply: (merged) => ({
      selectAIModel: defaultModels[merged.selectAIService] || '',
    }),
  },

  // Rule 6: slideMode ON
  {
    id: 'slideMode-on',
    description:
      'slideMode ON時にyoutubeMode OFF、conversationContinuityMode OFF',
    trigger: (_incoming, merged) => merged.slideMode === true,
    apply: () => ({
      youtubeMode: false,
      conversationContinuityMode: false,
    }),
  },

  // Rule 7: youtubeMode ON
  {
    id: 'youtubeMode-on',
    description: 'youtubeMode ON時にslideMode OFF + crossStoreEffects',
    trigger: (_incoming, merged) => merged.youtubeMode === true,
    apply: () => ({
      slideMode: false,
    }),
    crossStoreEffects: () => [
      { store: 'menu', state: { showWebcam: false } },
      { store: 'home', state: { modalImage: '' } },
      { store: 'slide', state: { isPlaying: false } },
    ],
  },

  // Rule 8: AIサービス変更 → 非マルチモーダル
  {
    id: 'aiService-nonMultiModal',
    description:
      'AIサービス変更時にデフォルトモデルが非マルチモーダルならslideMode等をOFF',
    trigger: (incoming, merged, prev) =>
      (wasSet(incoming, 'selectAIService') &&
        changed('selectAIService', prev, merged) &&
        !isMultiModalModel(
          merged.selectAIService,
          defaultModels[merged.selectAIService] || ''
        )) ||
      (wasSet(incoming, 'selectAIModel') &&
        changed('selectAIModel', prev, merged) &&
        !isMultiModalModel(
          merged.selectAIService,
          merged.selectAIModel || defaultModels[merged.selectAIService] || ''
        )),
    apply: () => ({
      conversationContinuityMode: false,
      slideMode: false,
      multiModalMode: 'never' as const,
    }),
    crossStoreEffects: () => [
      { store: 'menu', state: { showWebcam: false } },
      { store: 'slide', state: { isPlaying: false } },
    ],
  },

  // Rule 9: AIサービス変更 → 非OpenAI/Azure
  {
    id: 'aiService-nonRealtimeCapable',
    description:
      'AIサービスが非OpenAI/Azureに変更されたらrealtimeAPIMode/audioModeをOFF',
    trigger: (incoming, merged, prev) =>
      wasSet(incoming, 'selectAIService') &&
      changed('selectAIService', prev, merged) &&
      merged.selectAIService !== 'openai' &&
      merged.selectAIService !== 'azure',
    apply: () => ({
      realtimeAPIMode: false,
      audioMode: false,
    }),
  },

  // Rule 10: speechRecognitionMode = whisper
  {
    id: 'speechRecognition-whisper',
    description: 'whisperモード時にタイムアウト系リセット',
    trigger: (_incoming, merged) => merged.speechRecognitionMode === 'whisper',
    apply: () => ({
      initialSpeechTimeout: 0,
      noSpeechTimeout: 0,
      showSilenceProgressBar: false,
      continuousMicListeningMode: false,
    }),
  },

  // Rule 11: 言語が非日本語 + 日本語専用Voice
  {
    id: 'language-nonJa-jaVoice',
    description: '非日本語で日本語専用Voice選択時にgoogle TTSに変更',
    trigger: (incoming, merged) =>
      (wasSet(incoming, 'selectLanguage') || wasSet(incoming, 'selectVoice')) &&
      merged.selectLanguage !== 'ja' &&
      JA_ONLY_VOICES.includes(merged.selectVoice),
    apply: () => ({
      selectVoice: 'google' as const,
    }),
  },

  // Rule 12: Google + 非対応モデルでSearchGrounding OFF
  {
    id: 'google-searchGrounding',
    description: 'Googleの非対応モデルでSearchGroundingをOFF',
    trigger: (incoming, merged) =>
      (wasSet(incoming, 'selectAIModel') ||
        wasSet(incoming, 'selectAIService')) &&
      merged.selectAIService === 'google' &&
      !(googleSearchGroundingModels as readonly string[]).includes(
        merged.selectAIModel
      ),
    apply: () => ({
      useSearchGrounding: false,
    }),
  },

  // Rule 13: モデル変更時に非対応のreasoningEffort/reasoningModeをリセット
  {
    id: 'reasoning-effort-reset',
    description:
      'モデル変更時に非対応のreasoningEffort/reasoningModeをリセット',
    trigger: (incoming, merged, prev) =>
      (wasSet(incoming, 'selectAIModel') &&
        changed('selectAIModel', prev, merged)) ||
      (wasSet(incoming, 'selectAIService') &&
        changed('selectAIService', prev, merged)) ||
      (wasSet(incoming, 'customModel') && changed('customModel', prev, merged)),
    apply: (merged) => {
      const isReasoning = isReasoningModel(
        merged.selectAIService,
        merged.selectAIModel,
        merged.customModel
      )
      const efforts = getReasoningEfforts(
        merged.selectAIService,
        merged.selectAIModel,
        merged.customModel
      )
      const corrections: Partial<SettingsState> = {}

      if (!isReasoning && merged.reasoningMode) {
        corrections.reasoningMode = false
      }

      if (
        efforts.length > 0 &&
        !efforts.includes(merged.reasoningEffort as ReasoningEffort)
      ) {
        corrections.reasoningEffort = efforts.includes('medium')
          ? 'medium'
          : efforts[0]
      }

      return corrections
    },
  },

  // Rule 14: realtimeAPIMode ON → アイドル・人感検知OFF
  {
    id: 'realtimeAPI-on-disableIdlePresence',
    description:
      'realtimeAPIMode ON時にidleModeEnabled, presenceDetectionEnabledをOFFにする',
    trigger: (_incoming, merged) => merged.realtimeAPIMode === true,
    apply: () => ({
      idleModeEnabled: false,
      presenceDetectionEnabled: false,
    }),
  },

  // Rule 15: audioMode ON → アイドル・人感検知OFF
  {
    id: 'audioMode-on-disableIdlePresence',
    description:
      'audioMode ON時にidleModeEnabled, presenceDetectionEnabledをOFFにする',
    trigger: (_incoming, merged) => merged.audioMode === true,
    apply: () => ({
      idleModeEnabled: false,
      presenceDetectionEnabled: false,
    }),
  },

  // Rule 16: externalLinkageMode ON → アイドル・人感検知OFF
  {
    id: 'externalLinkage-on-disableIdlePresence',
    description:
      'externalLinkageMode ON時にidleModeEnabled, presenceDetectionEnabledをOFFにする',
    trigger: (_incoming, merged) => merged.externalLinkageMode === true,
    apply: () => ({
      idleModeEnabled: false,
      presenceDetectionEnabled: false,
    }),
  },

  // Rule 17: slideMode ON → アイドル・人感検知OFF
  {
    id: 'slideMode-on-disableIdlePresence',
    description:
      'slideMode ON時にidleModeEnabled, presenceDetectionEnabledをOFFにする',
    trigger: (_incoming, merged) => merged.slideMode === true,
    apply: () => ({
      idleModeEnabled: false,
      presenceDetectionEnabled: false,
    }),
  },
]
