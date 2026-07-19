describe('settingsStore persistence', () => {
  const storageKey = 'aitube-kit-settings'
  const originalSelectedVrmPath = process.env.NEXT_PUBLIC_SELECTED_VRM_PATH
  const originalAlwaysOverride =
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES
  const originalAlwaysOverrideModelSettings =
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_MODEL_SETTINGS_WITH_ENV_VARIABLES
  const originalSelectAIModel = process.env.NEXT_PUBLIC_SELECT_AI_MODEL
  const originalReasoningMode = process.env.NEXT_PUBLIC_REASONING_MODE
  const originalReasoningEffort = process.env.NEXT_PUBLIC_REASONING_EFFORT

  const loadStore = () => {
    jest.resetModules()
    return require('@/features/stores/settings').default
  }

  afterEach(() => {
    localStorage.clear()
    process.env.NEXT_PUBLIC_SELECTED_VRM_PATH = originalSelectedVrmPath
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES =
      originalAlwaysOverride
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_MODEL_SETTINGS_WITH_ENV_VARIABLES =
      originalAlwaysOverrideModelSettings
    process.env.NEXT_PUBLIC_SELECT_AI_MODEL = originalSelectAIModel
    process.env.NEXT_PUBLIC_REASONING_MODE = originalReasoningMode
    process.env.NEXT_PUBLIC_REASONING_EFFORT = originalReasoningEffort
  })

  it('prefers environment values before components read the store when override is enabled', () => {
    process.env.NEXT_PUBLIC_SELECTED_VRM_PATH = '/vrm/nikechan_v2.vrm'
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES = 'true'

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        state: {
          selectedVrmPath: '/vrm/nikechan_v1.vrm',
        },
        version: 0,
      })
    )

    const settingsStore = loadStore()

    expect(settingsStore.getState().selectedVrmPath).toBe(
      '/vrm/nikechan_v2.vrm'
    )
  })

  it('keeps persisted values when override is disabled', () => {
    process.env.NEXT_PUBLIC_SELECTED_VRM_PATH = '/vrm/nikechan_v2.vrm'
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES = 'false'

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        state: {
          selectedVrmPath: '/vrm/nikechan_v1.vrm',
        },
        version: 0,
      })
    )

    const settingsStore = loadStore()

    expect(settingsStore.getState().selectedVrmPath).toBe(
      '/vrm/nikechan_v1.vrm'
    )
  })

  it('overrides only model settings when the model override is enabled', () => {
    process.env.NEXT_PUBLIC_SELECTED_VRM_PATH = '/vrm/nikechan_v2.vrm'
    process.env.NEXT_PUBLIC_SELECT_AI_MODEL = 'gpt-5.6-terra'
    process.env.NEXT_PUBLIC_REASONING_MODE = 'true'
    process.env.NEXT_PUBLIC_REASONING_EFFORT = 'none'
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES = 'false'
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_MODEL_SETTINGS_WITH_ENV_VARIABLES =
      'true'

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        state: {
          selectedVrmPath: '/vrm/nikechan_v1.vrm',
          selectAIModel: 'gpt-4o',
          reasoningMode: false,
          reasoningEffort: 'medium',
        },
        version: 5,
      })
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.selectedVrmPath).toBe('/vrm/nikechan_v1.vrm')
    expect(state.selectAIModel).toBe('gpt-5.6-terra')
    expect(state.reasoningMode).toBe(true)
    expect(state.reasoningEffort).toBe('none')
  })
})
