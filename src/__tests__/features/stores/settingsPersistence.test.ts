describe('settingsStore persistence', () => {
  const storageKey = 'aitube-kit-settings'
  const originalSelectedVrmPath = process.env.NEXT_PUBLIC_SELECTED_VRM_PATH
  const originalAlwaysOverride =
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES
  const originalShowInputForm = process.env.NEXT_PUBLIC_SHOW_INPUT_FORM
  const originalChatLogMode = process.env.NEXT_PUBLIC_CHAT_LOG_MODE

  const loadStore = () => {
    jest.resetModules()
    return require('@/features/stores/settings').default
  }

  afterEach(() => {
    localStorage.clear()
    process.env.NEXT_PUBLIC_SELECTED_VRM_PATH = originalSelectedVrmPath
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES =
      originalAlwaysOverride
    if (originalShowInputForm === undefined) {
      delete process.env.NEXT_PUBLIC_SHOW_INPUT_FORM
    } else {
      process.env.NEXT_PUBLIC_SHOW_INPUT_FORM = originalShowInputForm
    }
    if (originalChatLogMode === undefined) {
      delete process.env.NEXT_PUBLIC_CHAT_LOG_MODE
    } else {
      process.env.NEXT_PUBLIC_CHAT_LOG_MODE = originalChatLogMode
    }
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

  it('uses environment defaults for chat log and input form visibility', () => {
    process.env.NEXT_PUBLIC_SHOW_INPUT_FORM = 'false'
    process.env.NEXT_PUBLIC_CHAT_LOG_MODE = 'hidden'

    const settingsStore = loadStore()

    expect(settingsStore.getState().showInputForm).toBe(false)
    expect(settingsStore.getState().chatLogMode).toBe('hidden')
  })

  it('falls back to the assistant view for an invalid chat log mode', () => {
    process.env.NEXT_PUBLIC_CHAT_LOG_MODE = 'invalid'

    const settingsStore = loadStore()

    expect(settingsStore.getState().chatLogMode).toBe('assistant')
  })

  it('persists customized keyboard shortcuts', () => {
    const settingsStore = loadStore()

    settingsStore.setState({
      settingsToggleShortcut: 'Control+Shift+KeyS',
      voiceInputShortcut: 'Space',
    })

    const persisted = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    expect(persisted.state.settingsToggleShortcut).toBe('Control+Shift+KeyS')
    expect(persisted.state.voiceInputShortcut).toBe('Space')
  })

  it('persists user-configurable settings previously omitted from storage', () => {
    process.env.NEXT_PUBLIC_ALWAYS_OVERRIDE_WITH_ENV_VARIABLES = 'false'
    const settingsStore = loadStore()

    settingsStore.setState({
      cartesiaApiKey: 'cartesia-test-key',
      dynamicRetrievalThreshold: 0.65,
      showControlPanel: false,
      showInputForm: false,
      chatLogMode: 'hidden',
    })

    const persisted = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    expect(persisted.state.cartesiaApiKey).toBe('cartesia-test-key')
    expect(persisted.state.dynamicRetrievalThreshold).toBe(0.65)
    expect(persisted.state.showControlPanel).toBe(false)
    expect(persisted.state.showInputForm).toBe(false)
    expect(persisted.state.chatLogMode).toBe('hidden')

    const reloadedSettingsStore = loadStore()
    expect(reloadedSettingsStore.getState().cartesiaApiKey).toBe(
      'cartesia-test-key'
    )
    expect(reloadedSettingsStore.getState().dynamicRetrievalThreshold).toBe(
      0.65
    )
    expect(reloadedSettingsStore.getState().showControlPanel).toBe(false)
    expect(reloadedSettingsStore.getState().showInputForm).toBe(false)
    expect(reloadedSettingsStore.getState().chatLogMode).toBe('hidden')
  })
})
