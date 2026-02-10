import type { SettingsState } from './settings'
import {
  exclusionRules,
  type ExclusionRule,
  type CrossStoreEffect,
} from './exclusionRules'
import { isMultiModalAvailable } from '../constants/aiModels'

export interface ExclusionResult {
  corrections: Partial<SettingsState>
  crossStoreEffects: CrossStoreEffect[]
}

const MAX_CASCADE_ITERATIONS = 5

export function computeExclusions(
  incoming: Partial<SettingsState>,
  currentState: SettingsState,
  rules: ExclusionRule[] = exclusionRules
): ExclusionResult {
  let merged = { ...currentState, ...incoming } as SettingsState
  const allCorrections: Partial<SettingsState> = {}
  const allCrossStoreEffects: CrossStoreEffect[] = []
  // incomingとcorrectionsの両方を含むキーセット（カスケード判定用）
  const effectiveIncoming = { ...incoming } as Partial<SettingsState>

  for (let iteration = 0; iteration < MAX_CASCADE_ITERATIONS; iteration++) {
    let changed = false

    for (const rule of rules) {
      if (!rule.trigger(effectiveIncoming, merged, currentState)) continue

      const corrections = rule.apply(merged)

      // incomingで明示的にセットされたキーはルールの補正対象外とする
      // （ユーザーの意図を優先）
      const filtered: Partial<SettingsState> = {}
      let hasNewCorrection = false
      for (const [key, value] of Object.entries(corrections)) {
        const k = key as keyof SettingsState
        // incomingで明示的にセットされたキーはスキップ
        if (k in incoming && incoming[k] !== undefined) continue
        if (merged[k] !== value) {
          ;(filtered as Record<string, unknown>)[key] = value
          hasNewCorrection = true
        }
      }

      if (hasNewCorrection) {
        merged = { ...merged, ...filtered } as SettingsState
        Object.assign(allCorrections, filtered)
        // カスケード判定のためにeffectiveIncomingにも追加
        Object.assign(effectiveIncoming, filtered)
        changed = true
      }

      if (rule.crossStoreEffects) {
        const effects = rule.crossStoreEffects(merged)
        for (const effect of effects) {
          // 重複防止: 同じstoreの同じキーは最新の値で上書き
          const existingIdx = allCrossStoreEffects.findIndex(
            (e) => e.store === effect.store
          )
          if (existingIdx >= 0) {
            allCrossStoreEffects[existingIdx] = {
              store: effect.store,
              state: {
                ...allCrossStoreEffects[existingIdx].state,
                ...effect.state,
              },
            }
          } else {
            allCrossStoreEffects.push(effect)
          }
        }
      }
    }

    if (!changed) break
  }

  return {
    corrections: allCorrections,
    crossStoreEffects: allCrossStoreEffects,
  }
}

export interface DisabledConditions {
  conversationContinuityMode: boolean
  slideMode: boolean
  speechRecognitionModeSwitcher: boolean
  voiceSettings: boolean
  temperatureMaxTokens: boolean
  idleModeEnabled: boolean
  presenceDetectionEnabled: boolean
}

export function computeDisabledConditions(
  state: SettingsState
): DisabledConditions {
  const multiModalAvail = isMultiModalAvailable(
    state.selectAIService,
    state.selectAIModel,
    state.enableMultiModal,
    state.multiModalMode,
    state.customModel
  )

  return {
    conversationContinuityMode:
      !multiModalAvail || state.slideMode || state.externalLinkageMode,
    slideMode: !multiModalAvail,
    speechRecognitionModeSwitcher: state.realtimeAPIMode || state.audioMode,
    voiceSettings: state.realtimeAPIMode || state.audioMode,
    temperatureMaxTokens: state.realtimeAPIMode || state.audioMode,
    idleModeEnabled:
      state.realtimeAPIMode ||
      state.audioMode ||
      state.externalLinkageMode ||
      state.slideMode,
    presenceDetectionEnabled:
      state.realtimeAPIMode ||
      state.audioMode ||
      state.externalLinkageMode ||
      state.slideMode,
  }
}
