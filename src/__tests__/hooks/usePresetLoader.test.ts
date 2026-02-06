import { renderHook, waitFor } from '@testing-library/react'
import settingsStore from '@/features/stores/settings'

// Mock presetLoader module
const mockLoadPreset = jest.fn()
jest.mock('@/features/presets/presetLoader', () => ({
  loadPreset: (...args: unknown[]) => mockLoadPreset(...args),
}))

// Import after mock setup
import { usePresetLoader } from '@/features/presets/usePresetLoader'

const PROMPT_PRESET_KEYS = [
  'idleAiPromptTemplate',
  'conversationContinuityPromptEvaluate',
  'conversationContinuityPromptContinuation',
  'conversationContinuityPromptSleep',
  'conversationContinuityPromptNewTopic',
  'conversationContinuityPromptSelectComment',
  'multiModalAiDecisionPrompt',
] as const

const PROMPT_PRESET_FILES = [
  'idle-ai-prompt-template.txt',
  'youtube-prompt-evaluate.txt',
  'youtube-prompt-continuation.txt',
  'youtube-prompt-sleep.txt',
  'youtube-prompt-new-topic.txt',
  'youtube-prompt-select-comment.txt',
  'multimodal-ai-decision-prompt.txt',
]

describe('usePresetLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    settingsStore.setState({
      characterPreset1: '',
      characterPreset2: '',
      characterPreset3: '',
      characterPreset4: '',
      characterPreset5: '',
      idleAiPromptTemplate: '',
      conversationContinuityPromptEvaluate: '',
      conversationContinuityPromptContinuation: '',
      conversationContinuityPromptSleep: '',
      conversationContinuityPromptNewTopic: '',
      conversationContinuityPromptSelectComment: '',
      multiModalAiDecisionPrompt: '',
    })
  })

  it('should load presets from files when store values are empty', async () => {
    mockLoadPreset.mockImplementation((filename: string) => {
      const presets: Record<string, string> = {
        'preset1.txt': 'Preset content 1',
        'preset2.txt': 'Preset content 2',
        'preset3.txt': 'Preset content 3',
        'preset4.txt': 'Preset content 4',
        'preset5.txt': 'Preset content 5',
      }
      return Promise.resolve(presets[filename] || null)
    })

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(12)
    })

    expect(mockLoadPreset).toHaveBeenCalledWith('preset1.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset2.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset3.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset4.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset5.txt')

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('Preset content 1')
    expect(state.characterPreset2).toBe('Preset content 2')
    expect(state.characterPreset3).toBe('Preset content 3')
    expect(state.characterPreset4).toBe('Preset content 4')
    expect(state.characterPreset5).toBe('Preset content 5')
  })

  it('should not overwrite existing store values', async () => {
    settingsStore.setState({
      characterPreset1: 'Existing custom preset',
      characterPreset3: 'Another custom preset',
    })

    mockLoadPreset.mockResolvedValue('File content')

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(10)
    })

    // Should skip preset1 and preset3 since they have existing values
    expect(mockLoadPreset).not.toHaveBeenCalledWith('preset1.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset2.txt')
    expect(mockLoadPreset).not.toHaveBeenCalledWith('preset3.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset4.txt')
    expect(mockLoadPreset).toHaveBeenCalledWith('preset5.txt')

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('Existing custom preset')
    expect(state.characterPreset3).toBe('Another custom preset')
  })

  it('should handle null responses from loadPreset gracefully', async () => {
    mockLoadPreset.mockResolvedValue(null)

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(12)
    })

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('')
    expect(state.characterPreset2).toBe('')
    expect(state.characterPreset3).toBe('')
    expect(state.characterPreset4).toBe('')
    expect(state.characterPreset5).toBe('')
  })

  it('should handle partial file availability', async () => {
    mockLoadPreset.mockImplementation((filename: string) => {
      if (filename === 'preset1.txt') return Promise.resolve('Only preset 1')
      return Promise.resolve(null)
    })

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(12)
    })

    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('Only preset 1')
    expect(state.characterPreset2).toBe('')
    expect(state.characterPreset3).toBe('')
    expect(state.characterPreset4).toBe('')
    expect(state.characterPreset5).toBe('')
  })

  it('should not set store state for empty string content', async () => {
    mockLoadPreset.mockResolvedValue('')

    renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(12)
    })

    // Empty string is falsy, so setState should not be called
    const state = settingsStore.getState()
    expect(state.characterPreset1).toBe('')
  })

  it('should only run once on mount', async () => {
    mockLoadPreset.mockResolvedValue('Content')

    const { rerender } = renderHook(() => usePresetLoader())

    await waitFor(() => {
      expect(mockLoadPreset).toHaveBeenCalledTimes(12)
    })

    rerender()

    // Should still be 12 calls total, not 24
    expect(mockLoadPreset).toHaveBeenCalledTimes(12)
  })

  describe('prompt presets', () => {
    it('should load prompt presets from txt files when store values are empty', async () => {
      mockLoadPreset.mockImplementation((filename: string) => {
        const presets: Record<string, string> = {
          'idle-ai-prompt-template.txt': 'Idle AI template',
          'youtube-prompt-evaluate.txt': 'Evaluate prompt',
          'youtube-prompt-continuation.txt': 'Continuation prompt',
          'youtube-prompt-sleep.txt': 'Sleep prompt',
          'youtube-prompt-new-topic.txt': 'New topic prompt',
          'youtube-prompt-select-comment.txt': 'Select comment prompt',
          'multimodal-ai-decision-prompt.txt': 'Multimodal decision prompt',
        }
        return Promise.resolve(presets[filename] || null)
      })

      renderHook(() => usePresetLoader())

      await waitFor(() => {
        expect(mockLoadPreset).toHaveBeenCalledTimes(12)
      })

      PROMPT_PRESET_FILES.forEach((filename) => {
        expect(mockLoadPreset).toHaveBeenCalledWith(filename)
      })

      const state = settingsStore.getState()
      expect(state.idleAiPromptTemplate).toBe('Idle AI template')
      expect(state.conversationContinuityPromptEvaluate).toBe('Evaluate prompt')
      expect(state.conversationContinuityPromptContinuation).toBe(
        'Continuation prompt'
      )
      expect(state.conversationContinuityPromptSleep).toBe('Sleep prompt')
      expect(state.conversationContinuityPromptNewTopic).toBe(
        'New topic prompt'
      )
      expect(state.conversationContinuityPromptSelectComment).toBe(
        'Select comment prompt'
      )
      expect(state.multiModalAiDecisionPrompt).toBe(
        'Multimodal decision prompt'
      )
    })

    it('should not overwrite existing prompt preset values', async () => {
      settingsStore.setState({
        idleAiPromptTemplate: 'Custom idle template',
        conversationContinuityPromptEvaluate: 'Custom evaluate',
      })

      mockLoadPreset.mockResolvedValue('File content')

      renderHook(() => usePresetLoader())

      await waitFor(() => {
        const state = settingsStore.getState()
        expect(state.multiModalAiDecisionPrompt).toBe('File content')
      })

      expect(mockLoadPreset).not.toHaveBeenCalledWith(
        'idle-ai-prompt-template.txt'
      )
      expect(mockLoadPreset).not.toHaveBeenCalledWith(
        'youtube-prompt-evaluate.txt'
      )

      const state = settingsStore.getState()
      expect(state.idleAiPromptTemplate).toBe('Custom idle template')
      expect(state.conversationContinuityPromptEvaluate).toBe('Custom evaluate')
    })

    it('should not overwrite values set during async loading (race condition guard)', async () => {
      mockLoadPreset.mockImplementation((filename: string) => {
        if (filename === 'idle-ai-prompt-template.txt') {
          // Simulate user editing the store while the file is being fetched
          settingsStore.setState({
            idleAiPromptTemplate: 'User edited value',
          })
          return Promise.resolve('File content')
        }
        return Promise.resolve(null)
      })

      renderHook(() => usePresetLoader())

      await waitFor(() => {
        expect(mockLoadPreset).toHaveBeenCalledWith(
          'idle-ai-prompt-template.txt'
        )
      })

      // User's edit should be preserved, not overwritten by file content
      const state = settingsStore.getState()
      expect(state.idleAiPromptTemplate).toBe('User edited value')
    })
  })
})
