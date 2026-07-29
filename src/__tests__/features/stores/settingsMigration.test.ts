import { DEFAULT_GAME_COMMENTARY_CONFIG } from '@/features/gameCommentary/gameCommentaryTypes'

describe('settingsStore versioned migration', () => {
  const storageKey = 'aitube-kit-settings'

  const loadStore = () => {
    jest.resetModules()
    return require('@/features/stores/settings').default
  }

  const setPersisted = (state: Record<string, unknown>, version: number) => {
    localStorage.setItem(storageKey, JSON.stringify({ state, version }))
  }

  afterEach(() => {
    localStorage.clear()
  })

  it('migrates version 0 (pre-migration-system) data through every step', () => {
    setPersisted(
      {
        selectAIService: 'openai',
        selectAIModel: 'gpt-4o-2024-11-20',
        presenceGreetingMessage: 'おかえりなさい',
        presenceDepartureMessage: 'またね',
        multiModalMode: 'never',
      },
      0
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.selectAIModel).toBe('gpt-4o')
    expect(state.presenceGreetingPhrases).toHaveLength(1)
    expect(state.presenceGreetingPhrases[0].text).toBe('おかえりなさい')
    expect(state.presenceDeparturePhrases).toHaveLength(1)
    expect(state.presenceDeparturePhrases[0].text).toBe('またね')
    expect(state.enableMultiModal).toBe(false)
    expect(state.gameCommentaryEnabled).toBe(
      DEFAULT_GAME_COMMENTARY_CONFIG.gameCommentaryEnabled
    )
    expect(state).not.toHaveProperty('presenceGreetingMessage')
    expect(state).not.toHaveProperty('presenceDepartureMessage')
    expect(state).not.toHaveProperty('multiModalMode')
  })

  it('migrates version 1 data (OpenAI model already renamed) through remaining steps only', () => {
    setPersisted(
      {
        presenceGreetingMessage: 'こんにちは',
        multiModalMode: 'always',
      },
      1
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.presenceGreetingPhrases).toHaveLength(1)
    expect(state.enableMultiModal).toBe(true)
  })

  it('migrates version 2 data (presence already migrated) through remaining steps only', () => {
    setPersisted(
      {
        multiModalMode: 'ai-decide',
        gameCommentaryVideoBufferWidth: 640,
        gameCommentaryVideoDelay: 100,
      },
      2
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.enableMultiModal).toBe(true)
    expect(state).not.toHaveProperty('gameCommentaryVideoBufferWidth')
    expect(state).not.toHaveProperty('gameCommentaryVideoDelay')
  })

  it('migrates version 3 data through the final game-commentary defaults step only', () => {
    setPersisted(
      {
        gameCommentaryVideoBufferWidth: 640,
      },
      3
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.gameCommentaryEnabled).toBe(
      DEFAULT_GAME_COMMENTARY_CONFIG.gameCommentaryEnabled
    )
    expect(state).not.toHaveProperty('gameCommentaryVideoBufferWidth')
  })

  it('migrates version 4 data through the final audio model rename step only', () => {
    setPersisted(
      {
        selectAIService: 'openai',
        selectAIModel: 'gpt-4o-mini-audio-preview',
      },
      4
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.selectAIModel).toBe('gpt-audio-mini')
  })

  it('migrates version 5 data by replacing a stale OpenAI reasoning effort', () => {
    setPersisted(
      {
        selectAIService: 'openai',
        selectAIModel: 'gpt-5.4-mini',
        reasoningEffort: 'minimal',
      },
      5
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.reasoningEffort).toBe('medium')
  })

  it('migrates version 6 data away from the deprecated transcription snapshot', () => {
    setPersisted(
      {
        whisperTranscriptionModel: 'gpt-4o-mini-transcribe-2025-03-20',
      },
      6
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.whisperTranscriptionModel).toBe(
      'gpt-4o-mini-transcribe-2025-12-15'
    )
  })

  it.each([
    ['gpt-realtime', 'gpt-realtime-2.1'],
    ['gpt-4o-realtime', 'gpt-realtime-2.1'],
    ['gpt-realtime-mini', 'gpt-realtime-2.1-mini'],
    ['gpt-4o-mini-realtime', 'gpt-realtime-2.1-mini'],
  ])(
    'migrates version 7 Realtime model %s to %s',
    (deprecatedModel, replacementModel) => {
      setPersisted({ selectAIModel: deprecatedModel }, 7)

      const settingsStore = loadStore()

      expect(settingsStore.getState().selectAIModel).toBe(replacementModel)
    }
  )

  it('does not run migration steps for already-current data', () => {
    setPersisted(
      {
        selectAIModel: 'gpt-4o',
        gameCommentaryEnabled: false,
      },
      8
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    // A stale field left over from an old generation is untouched because
    // migrate() is skipped entirely when the stored version already matches.
    expect(state.selectAIModel).toBe('gpt-4o')
    expect(state.gameCommentaryEnabled).toBe(false)
  })

  it('is a no-op when the stored version is newer than the current schema (downgrade safety)', () => {
    setPersisted(
      {
        selectAIModel: 'gpt-4o',
      },
      999
    )

    const settingsStore = loadStore()
    const state = settingsStore.getState()

    expect(state.selectAIModel).toBe('gpt-4o')
  })
})
