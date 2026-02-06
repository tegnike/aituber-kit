import { useEffect } from 'react'
import settingsStore from '@/features/stores/settings'
import { loadPreset } from './presetLoader'

const PROMPT_PRESETS: { key: string; filename: string }[] = [
  { key: 'idleAiPromptTemplate', filename: 'idle-ai-prompt-template.txt' },
  {
    key: 'conversationContinuityPromptEvaluate',
    filename: 'youtube-prompt-evaluate.txt',
  },
  {
    key: 'conversationContinuityPromptContinuation',
    filename: 'youtube-prompt-continuation.txt',
  },
  {
    key: 'conversationContinuityPromptSleep',
    filename: 'youtube-prompt-sleep.txt',
  },
  {
    key: 'conversationContinuityPromptNewTopic',
    filename: 'youtube-prompt-new-topic.txt',
  },
  {
    key: 'conversationContinuityPromptSelectComment',
    filename: 'youtube-prompt-select-comment.txt',
  },
  {
    key: 'multiModalAiDecisionPrompt',
    filename: 'multimodal-ai-decision-prompt.txt',
  },
]

export function usePresetLoader(): void {
  useEffect(() => {
    const loadPresets = async () => {
      for (let i = 1; i <= 5; i++) {
        const key = `characterPreset${i}` as keyof ReturnType<
          typeof settingsStore.getState
        >
        const current = settingsStore.getState()[key]
        if (current) continue
        const content = await loadPreset(`preset${i}.txt`)
        if (content) {
          settingsStore.setState({ [`characterPreset${i}`]: content })
        }
      }

      for (const { key, filename } of PROMPT_PRESETS) {
        const storeKey = key as keyof ReturnType<typeof settingsStore.getState>
        if (settingsStore.getState()[storeKey]) continue
        const content = await loadPreset(filename)
        if (content && !settingsStore.getState()[storeKey]) {
          settingsStore.setState({ [key]: content })
        }
      }
    }
    loadPresets()
  }, [])
}
