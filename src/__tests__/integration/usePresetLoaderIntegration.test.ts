import { renderHook, waitFor } from '@testing-library/react'
import settingsStore from '@/features/stores/settings'
import { loadPreset } from '@/features/presets/presetLoader'
import { usePresetLoader } from '@/features/presets/usePresetLoader'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Preset Loader Integration Tests', () => {
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

  describe('loadPreset (fetch integration)', () => {
    it('should fetch preset file and return text content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('System prompt content'),
      })

      const result = await loadPreset('preset1.txt')
      expect(result).toBe('System prompt content')
      expect(mockFetch).toHaveBeenCalledWith('/presets/preset1.txt')
    })

    it('should return null when fetch response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await loadPreset('preset1.txt')
      expect(result).toBeNull()
    })

    it('should return null when fetch throws an error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await loadPreset('preset1.txt')
      expect(result).toBeNull()
    })

    it('should handle various preset filenames', async () => {
      for (let i = 1; i <= 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`Content ${i}`),
        })

        const result = await loadPreset(`preset${i}.txt`)
        expect(result).toBe(`Content ${i}`)
        expect(mockFetch).toHaveBeenCalledWith(`/presets/preset${i}.txt`)
      }
    })

    it('should handle prompt preset filenames', async () => {
      const promptFiles = [
        'idle-ai-prompt-template.txt',
        'youtube-prompt-evaluate.txt',
        'multimodal-ai-decision-prompt.txt',
      ]

      for (const filename of promptFiles) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(`Content of ${filename}`),
        })

        const result = await loadPreset(filename)
        expect(result).toBe(`Content of ${filename}`)
        expect(mockFetch).toHaveBeenCalledWith(`/presets/${filename}`)
      }
    })
  })

  describe('Full E2E: usePresetLoader -> fetch -> store', () => {
    it('should load presets from fetch and reflect in store', async () => {
      mockFetch.mockImplementation((url: string) => {
        const content: Record<string, string> = {
          '/presets/preset1.txt': 'You are a friendly assistant.',
          '/presets/preset2.txt': 'You are a formal assistant.',
          '/presets/preset3.txt': 'You are a creative writer.',
          '/presets/preset4.txt': 'You are a code reviewer.',
          '/presets/preset5.txt': 'You are a language tutor.',
          '/presets/idle-ai-prompt-template.txt': 'Idle AI template content',
          '/presets/youtube-prompt-evaluate.txt': 'Evaluate prompt content',
          '/presets/youtube-prompt-continuation.txt':
            'Continuation prompt content',
          '/presets/youtube-prompt-sleep.txt': 'Sleep prompt content',
          '/presets/youtube-prompt-new-topic.txt': 'New topic prompt content',
          '/presets/youtube-prompt-select-comment.txt':
            'Select comment prompt content',
          '/presets/multimodal-ai-decision-prompt.txt':
            'Multimodal decision prompt content',
        }
        if (content[url]) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(content[url]),
          })
        }
        return Promise.resolve({ ok: false })
      })

      renderHook(() => usePresetLoader())

      await waitFor(() => {
        const state = settingsStore.getState()
        expect(state.multiModalAiDecisionPrompt).toBe(
          'Multimodal decision prompt content'
        )
      })

      const state = settingsStore.getState()
      expect(state.characterPreset1).toBe('You are a friendly assistant.')
      expect(state.characterPreset2).toBe('You are a formal assistant.')
      expect(state.characterPreset3).toBe('You are a creative writer.')
      expect(state.characterPreset4).toBe('You are a code reviewer.')
      expect(state.characterPreset5).toBe('You are a language tutor.')
      expect(state.idleAiPromptTemplate).toBe('Idle AI template content')
      expect(state.conversationContinuityPromptEvaluate).toBe(
        'Evaluate prompt content'
      )
      expect(state.conversationContinuityPromptContinuation).toBe(
        'Continuation prompt content'
      )
      expect(state.conversationContinuityPromptSleep).toBe(
        'Sleep prompt content'
      )
      expect(state.conversationContinuityPromptNewTopic).toBe(
        'New topic prompt content'
      )
      expect(state.conversationContinuityPromptSelectComment).toBe(
        'Select comment prompt content'
      )
      expect(state.multiModalAiDecisionPrompt).toBe(
        'Multimodal decision prompt content'
      )
    })

    it('should preserve existing presets and only load missing ones', async () => {
      settingsStore.setState({
        characterPreset1: 'Custom user preset',
        characterPreset2: '',
        characterPreset3: 'Another custom preset',
        characterPreset4: '',
        characterPreset5: '',
        idleAiPromptTemplate: 'Custom idle template',
      })

      mockFetch.mockImplementation((url: string) => {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`File: ${url}`),
        })
      })

      renderHook(() => usePresetLoader())

      await waitFor(() => {
        const state = settingsStore.getState()
        expect(state.characterPreset2).toBe('File: /presets/preset2.txt')
      })

      const state = settingsStore.getState()
      // Existing values preserved
      expect(state.characterPreset1).toBe('Custom user preset')
      expect(state.characterPreset3).toBe('Another custom preset')
      expect(state.idleAiPromptTemplate).toBe('Custom idle template')
      // Missing values loaded from files
      expect(state.characterPreset2).toBe('File: /presets/preset2.txt')
      expect(state.characterPreset4).toBe('File: /presets/preset4.txt')
      expect(state.characterPreset5).toBe('File: /presets/preset5.txt')
    })

    it('should handle mixed fetch results (some succeed, some fail)', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url === '/presets/preset1.txt') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('Loaded preset 1'),
          })
        }
        if (url === '/presets/preset3.txt') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ ok: false })
      })

      renderHook(() => usePresetLoader())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(12)
      })

      const state = settingsStore.getState()
      expect(state.characterPreset1).toBe('Loaded preset 1')
      expect(state.characterPreset2).toBe('')
      expect(state.characterPreset3).toBe('')
      expect(state.characterPreset4).toBe('')
      expect(state.characterPreset5).toBe('')
    })

    it('should handle multiline preset content', async () => {
      const multilineContent = `You are a helpful assistant.
You speak politely.
You always provide detailed answers.`

      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(multilineContent),
        })
      )

      renderHook(() => usePresetLoader())

      await waitFor(() => {
        const state = settingsStore.getState()
        expect(state.characterPreset1).toBe(multilineContent)
      })

      const state = settingsStore.getState()
      expect(state.characterPreset1).toContain('\n')
    })
  })
})
