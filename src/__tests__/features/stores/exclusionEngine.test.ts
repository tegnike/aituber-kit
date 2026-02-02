/**
 * @jest-environment node
 */
import {
  computeExclusions,
  computeDisabledConditions,
} from '@/features/stores/exclusionEngine'
import { exclusionRules } from '@/features/stores/exclusionRules'
import type { SettingsState } from '@/features/stores/settings'
import { defaultModels } from '@/features/constants/aiModels'

// テスト用のベースstate（必要最小限のフィールドのみ）
function createBaseState(
  overrides: Partial<SettingsState> = {}
): SettingsState {
  return {
    selectAIService: 'openai',
    selectAIModel: defaultModels.openai,
    selectVoice: 'voicevox',
    selectLanguage: 'ja',
    realtimeAPIMode: false,
    audioMode: false,
    externalLinkageMode: false,
    conversationContinuityMode: false,
    slideMode: false,
    youtubeMode: false,
    speechRecognitionMode: 'browser',
    initialSpeechTimeout: 5.0,
    noSpeechTimeout: 5.0,
    showSilenceProgressBar: true,
    continuousMicListeningMode: true,
    useSearchGrounding: false,
    multiModalMode: 'ai-decide',
    enableMultiModal: true,
    customModel: false,
    ...overrides,
  } as SettingsState
}

describe('排他エンジン (computeExclusions)', () => {
  describe('Rule 1: externalLinkage-on', () => {
    it('externalLinkageMode ON で conversationContinuityMode, realtimeAPIMode, audioMode が OFF になる', () => {
      const prev = createBaseState({
        conversationContinuityMode: true,
        realtimeAPIMode: true,
        audioMode: true,
      })
      const incoming = { externalLinkageMode: true }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.conversationContinuityMode).toBe(false)
      expect(corrections.realtimeAPIMode).toBe(false)
      expect(corrections.audioMode).toBe(false)
    })

    it('externalLinkageMode OFF では排他ルールが発火しない', () => {
      const prev = createBaseState({
        externalLinkageMode: true,
        conversationContinuityMode: true,
      })
      const incoming = { externalLinkageMode: false }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.conversationContinuityMode).toBeUndefined()
    })
  })

  describe('Rule 2: realtimeAPI-on', () => {
    it('realtimeAPIMode ON で適切なstate変更が行われる', () => {
      const prev = createBaseState({
        audioMode: true,
        speechRecognitionMode: 'whisper',
        initialSpeechTimeout: 5.0,
        noSpeechTimeout: 5.0,
        showSilenceProgressBar: true,
        continuousMicListeningMode: true,
      })
      const incoming = { realtimeAPIMode: true }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.audioMode).toBe(false)
      expect(corrections.speechRecognitionMode).toBe('browser')
      expect(corrections.selectAIModel).toBe(defaultModels.openaiRealtime)
      expect(corrections.initialSpeechTimeout).toBe(0)
      expect(corrections.noSpeechTimeout).toBe(0)
      expect(corrections.showSilenceProgressBar).toBe(false)
      expect(corrections.continuousMicListeningMode).toBe(false)
    })
  })

  describe('Rule 3: audioMode-on', () => {
    it('audioMode ON で realtimeAPIMode OFF、タイムアウトリセットされる', () => {
      const prev = createBaseState({
        realtimeAPIMode: true,
        speechRecognitionMode: 'whisper',
        initialSpeechTimeout: 5.0,
        noSpeechTimeout: 5.0,
      })
      const incoming = { audioMode: true }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.realtimeAPIMode).toBe(false)
      expect(corrections.speechRecognitionMode).toBe('browser')
      expect(corrections.selectAIModel).toBe(defaultModels.openaiAudio)
      expect(corrections.initialSpeechTimeout).toBe(0)
      expect(corrections.noSpeechTimeout).toBe(0)
      expect(corrections.showSilenceProgressBar).toBe(false)
      expect(corrections.continuousMicListeningMode).toBe(false)
    })
  })

  describe('Rule 4: realtimeAPI-off', () => {
    it('realtimeAPIMode OFF（前値ON）でモデルがデフォルトに復元される', () => {
      const prev = createBaseState({
        realtimeAPIMode: true,
        selectAIModel: defaultModels.openaiRealtime,
        selectAIService: 'openai',
      })
      const incoming = { realtimeAPIMode: false }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.selectAIModel).toBe(defaultModels.openai)
    })

    it('Azure サービスでも realtimeAPIMode OFF 時にモデルが復元される', () => {
      const prev = createBaseState({
        realtimeAPIMode: true,
        selectAIModel: defaultModels.openaiRealtime,
        selectAIService: 'azure',
      })
      const incoming = { realtimeAPIMode: false }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.selectAIModel).toBe(defaultModels.azure)
    })
  })

  describe('Rule 5: audioMode-off', () => {
    it('audioMode OFF（前値ON）でモデルがデフォルトに復元される', () => {
      const prev = createBaseState({
        audioMode: true,
        selectAIModel: defaultModels.openaiAudio,
        selectAIService: 'openai',
      })
      const incoming = { audioMode: false }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.selectAIModel).toBe(defaultModels.openai)
    })
  })

  describe('Rule 6: slideMode-on', () => {
    it('slideMode ON で youtubeMode OFF、conversationContinuityMode OFF', () => {
      const prev = createBaseState({
        youtubeMode: true,
        conversationContinuityMode: true,
      })
      const incoming = { slideMode: true }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.youtubeMode).toBe(false)
      expect(corrections.conversationContinuityMode).toBe(false)
    })
  })

  describe('Rule 7: youtubeMode-on', () => {
    it('youtubeMode ON で slideMode OFF + crossStoreEffects', () => {
      const prev = createBaseState({ slideMode: true })
      const incoming = { youtubeMode: true }
      const { corrections, crossStoreEffects } = computeExclusions(
        incoming,
        prev
      )

      expect(corrections.slideMode).toBe(false)
      expect(crossStoreEffects).toEqual(
        expect.arrayContaining([
          { store: 'menu', state: { showWebcam: false } },
          { store: 'home', state: { modalImage: '' } },
          { store: 'slide', state: { isPlaying: false } },
        ])
      )
    })
  })

  describe('Rule 8: aiService-nonMultiModal', () => {
    it('非マルチモーダルサービスに変更で slideMode, conversationContinuityMode OFF', () => {
      const prev = createBaseState({
        selectAIService: 'openai',
        slideMode: true,
        conversationContinuityMode: true,
        multiModalMode: 'ai-decide',
      })
      // difyはマルチモーダル非対応
      const incoming = { selectAIService: 'dify' as const }
      const { corrections, crossStoreEffects } = computeExclusions(
        incoming,
        prev
      )

      expect(corrections.conversationContinuityMode).toBe(false)
      expect(corrections.slideMode).toBe(false)
      expect(corrections.multiModalMode).toBe('never')
      expect(crossStoreEffects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ store: 'menu' }),
          expect.objectContaining({ store: 'slide' }),
        ])
      )
    })
  })

  describe('Rule 9: aiService-nonRealtimeCapable', () => {
    it('非OpenAI/Azureサービスに変更で realtimeAPIMode, audioMode OFF', () => {
      const prev = createBaseState({
        selectAIService: 'openai',
        realtimeAPIMode: true,
        audioMode: true,
      })
      const incoming = { selectAIService: 'google' as const }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.realtimeAPIMode).toBe(false)
      expect(corrections.audioMode).toBe(false)
    })

    it('OpenAIからAzureへの変更では発火しない', () => {
      const prev = createBaseState({
        selectAIService: 'openai',
        realtimeAPIMode: true,
      })
      const incoming = { selectAIService: 'azure' as const }
      const { corrections } = computeExclusions(incoming, prev)

      // realtimeAPIModeはONのまま（Rule 9が発火しない）
      expect(corrections.realtimeAPIMode).toBeUndefined()
    })
  })

  describe('Rule 10: speechRecognition-whisper', () => {
    it('whisperモードでタイムアウト系がリセットされる', () => {
      const prev = createBaseState({
        initialSpeechTimeout: 5.0,
        noSpeechTimeout: 5.0,
        showSilenceProgressBar: true,
        continuousMicListeningMode: true,
      })
      const incoming = { speechRecognitionMode: 'whisper' as const }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.initialSpeechTimeout).toBe(0)
      expect(corrections.noSpeechTimeout).toBe(0)
      expect(corrections.showSilenceProgressBar).toBe(false)
      expect(corrections.continuousMicListeningMode).toBe(false)
    })
  })

  describe('Rule 11: language-nonJa-jaVoice', () => {
    it('非日本語で日本語専用Voice選択時にgoogle TTSに変更される', () => {
      const prev = createBaseState({
        selectLanguage: 'ja',
        selectVoice: 'voicevox',
      })
      const incoming = { selectLanguage: 'en' as const }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.selectVoice).toBe('google')
    })

    it('日本語に戻す場合はvoiceを変更しない', () => {
      const prev = createBaseState({
        selectLanguage: 'en',
        selectVoice: 'google',
      })
      const incoming = { selectLanguage: 'ja' as const }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.selectVoice).toBeUndefined()
    })

    it('非日本語専用Voice（google等）選択時は変更しない', () => {
      const prev = createBaseState({
        selectLanguage: 'ja',
        selectVoice: 'google',
      })
      const incoming = { selectLanguage: 'en' as const }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.selectVoice).toBeUndefined()
    })
  })

  describe('Rule 12: google-searchGrounding', () => {
    it('Google非対応モデルでSearchGroundingがOFFになる', () => {
      const prev = createBaseState({
        selectAIService: 'google',
        useSearchGrounding: true,
        selectAIModel: 'gemini-1.5-flash',
      })
      // Gemini 2.5系はSearchGrounding非対応
      const incoming = { selectAIModel: 'gemini-2.5-flash' }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.useSearchGrounding).toBe(false)
    })

    it('Google対応モデルではSearchGroundingは変更されない', () => {
      const prev = createBaseState({
        selectAIService: 'google',
        useSearchGrounding: true,
        selectAIModel: 'gemini-2.5-flash',
      })
      const incoming = { selectAIModel: 'gemini-1.5-flash' }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.useSearchGrounding).toBeUndefined()
    })
  })

  describe('カスケードテスト', () => {
    it('externalLinkageMode ON → realtimeAPIMode OFF → モデル復元のカスケード', () => {
      const prev = createBaseState({
        realtimeAPIMode: true,
        selectAIModel: defaultModels.openaiRealtime,
        selectAIService: 'openai',
      })
      const incoming = { externalLinkageMode: true }
      const { corrections } = computeExclusions(incoming, prev)

      // Rule 1: realtimeAPIMode OFF
      expect(corrections.realtimeAPIMode).toBe(false)
      // カスケード Rule 4: モデル復元
      expect(corrections.selectAIModel).toBe(defaultModels.openai)
    })
  })

  describe('無関係なsetStateが排他ルールを発火しないテスト', () => {
    it('openaiKeyの変更は排他ルールを発火しない', () => {
      const prev = createBaseState()
      const incoming = { openaiKey: 'sk-new-key' }
      const { corrections, crossStoreEffects } = computeExclusions(
        incoming,
        prev
      )

      // correctionsにルール由来の変更がない
      expect(Object.keys(corrections)).toHaveLength(0)
      expect(crossStoreEffects).toHaveLength(0)
    })

    it('characterNameの変更は排他ルールを発火しない', () => {
      const prev = createBaseState()
      const incoming = { characterName: 'NewCharacter' }
      const { corrections, crossStoreEffects } = computeExclusions(
        incoming,
        prev
      )

      expect(Object.keys(corrections)).toHaveLength(0)
      expect(crossStoreEffects).toHaveLength(0)
    })
  })

  describe('不整合修正の検証', () => {
    it('修正1: externalLinkageMode ON で audioMode も OFF になる', () => {
      const prev = createBaseState({ audioMode: true })
      const incoming = { externalLinkageMode: true }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.audioMode).toBe(false)
    })

    it('修正2: audioMode ON でタイムアウト系もリセットされる', () => {
      const prev = createBaseState({
        initialSpeechTimeout: 5.0,
        noSpeechTimeout: 5.0,
        showSilenceProgressBar: true,
        continuousMicListeningMode: true,
      })
      const incoming = { audioMode: true }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.initialSpeechTimeout).toBe(0)
      expect(corrections.noSpeechTimeout).toBe(0)
      expect(corrections.showSilenceProgressBar).toBe(false)
      expect(corrections.continuousMicListeningMode).toBe(false)
    })

    it('修正3: Azure realtimeAPIMode OFF でもモデルが復元される', () => {
      const prev = createBaseState({
        selectAIService: 'azure',
        realtimeAPIMode: true,
        selectAIModel: defaultModels.openaiRealtime,
      })
      const incoming = { realtimeAPIMode: false }
      const { corrections } = computeExclusions(incoming, prev)

      expect(corrections.selectAIModel).toBe(defaultModels.azure)
    })
  })

  describe('crossStoreEffectsの重複マージ', () => {
    it('同一storeへの複数エフェクトがマージされる', () => {
      const prev = createBaseState({
        selectAIService: 'openai',
        slideMode: true,
        youtubeMode: false,
      })
      // slideMode ON + youtubeMode ON → Rule 6 と Rule 7 の両方が発火
      // ただし Rule 6 が youtubeMode=false にし、Rule 7 は merged.youtubeMode=true で判定
      // 実際は incoming に youtubeMode: true がセットされているケース
      const incoming = { youtubeMode: true }
      const { crossStoreEffects } = computeExclusions(incoming, prev)

      // slideStore への重複エフェクトがマージされているか確認
      const slideEffects = crossStoreEffects.filter((e) => e.store === 'slide')
      expect(slideEffects.length).toBeLessThanOrEqual(1)
    })
  })
})

describe('disabled条件 (computeDisabledConditions)', () => {
  it('realtimeAPIMode ON で speechRecognition, voice, temperature が disabled', () => {
    const state = createBaseState({ realtimeAPIMode: true })
    const conditions = computeDisabledConditions(state)

    expect(conditions.speechRecognitionModeSwitcher).toBe(true)
    expect(conditions.voiceSettings).toBe(true)
    expect(conditions.temperatureMaxTokens).toBe(true)
  })

  it('audioMode ON で speechRecognition, voice, temperature が disabled', () => {
    const state = createBaseState({ audioMode: true })
    const conditions = computeDisabledConditions(state)

    expect(conditions.speechRecognitionModeSwitcher).toBe(true)
    expect(conditions.voiceSettings).toBe(true)
    expect(conditions.temperatureMaxTokens).toBe(true)
  })

  it('slideMode ON で conversationContinuityMode が disabled', () => {
    const state = createBaseState({ slideMode: true })
    const conditions = computeDisabledConditions(state)

    expect(conditions.conversationContinuityMode).toBe(true)
  })

  it('externalLinkageMode ON で conversationContinuityMode が disabled', () => {
    const state = createBaseState({ externalLinkageMode: true })
    const conditions = computeDisabledConditions(state)

    expect(conditions.conversationContinuityMode).toBe(true)
  })

  it('multiModalMode=never で slideMode, conversationContinuityMode が disabled', () => {
    const state = createBaseState({ multiModalMode: 'never' })
    const conditions = computeDisabledConditions(state)

    expect(conditions.slideMode).toBe(true)
    expect(conditions.conversationContinuityMode).toBe(true)
  })

  it('通常状態ではすべて enabled', () => {
    const state = createBaseState()
    const conditions = computeDisabledConditions(state)

    expect(conditions.speechRecognitionModeSwitcher).toBe(false)
    expect(conditions.voiceSettings).toBe(false)
    expect(conditions.temperatureMaxTokens).toBe(false)
    expect(conditions.slideMode).toBe(false)
  })
})
