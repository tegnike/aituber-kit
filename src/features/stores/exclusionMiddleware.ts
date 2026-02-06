import type { StateCreator, StoreMutatorIdentifier } from 'zustand'
import type { SettingsState } from './settings'
import { computeExclusions, type ExclusionResult } from './exclusionEngine'
import type { CrossStoreEffect } from './exclusionRules'

type ExclusivityMiddleware = <
  T extends SettingsState,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: StateCreator<T, Mps, Mcs>
) => StateCreator<T, Mps, Mcs>

function applyRules(
  partial:
    | Partial<SettingsState>
    | ((state: SettingsState) => Partial<SettingsState>),
  currentState: SettingsState
): ExclusionResult & { resolved: Partial<SettingsState> } {
  const resolved =
    typeof partial === 'function' ? partial(currentState) : partial

  if (!resolved || typeof resolved !== 'object') {
    return {
      resolved: resolved as Partial<SettingsState>,
      corrections: {},
      crossStoreEffects: [],
    }
  }

  const { corrections, crossStoreEffects } = computeExclusions(
    resolved,
    currentState
  )

  return {
    resolved: { ...resolved, ...corrections },
    corrections,
    crossStoreEffects,
  }
}

function scheduleCrossStoreEffects(effects: CrossStoreEffect[]): void {
  if (effects.length === 0) return

  queueMicrotask(() => {
    for (const effect of effects) {
      switch (effect.store) {
        case 'menu': {
          const menuStore = require('./menu').default
          menuStore.setState(effect.state)
          break
        }
        case 'home': {
          const homeStore = require('./home').default
          homeStore.setState(effect.state)
          break
        }
        case 'slide': {
          const slideStore = require('./slide').default
          slideStore.setState(effect.state)
          break
        }
      }
    }
  })
}

export const exclusivityMiddleware: ExclusivityMiddleware =
  (config) => (set, get, api) => {
    const wrappedSet = (
      partial:
        | Partial<SettingsState>
        | ((state: SettingsState) => Partial<SettingsState>),
      replace?: boolean
    ) => {
      const { resolved, crossStoreEffects } = applyRules(
        partial,
        get() as SettingsState
      )
      ;(set as Function)(resolved, replace)
      scheduleCrossStoreEffects(crossStoreEffects)
    }

    // persistに wrappedSet を渡して実行
    const result = config(wrappedSet as unknown as typeof set, get, api)

    // persist が api.setState をオーバーライドした後にラップ
    const persistSetState = api.setState
    api.setState = (
      partial: unknown,
      replace?: boolean,
      ...rest: unknown[]
    ) => {
      const { resolved, crossStoreEffects } = applyRules(
        partial as Partial<SettingsState>,
        api.getState() as SettingsState
      )
      ;(persistSetState as Function)(resolved, replace, ...rest)
      scheduleCrossStoreEffects(crossStoreEffects)
    }

    return result
  }
