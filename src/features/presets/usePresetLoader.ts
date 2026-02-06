import { useEffect } from 'react'
import settingsStore from '@/features/stores/settings'
import { loadPreset } from './presetLoader'

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
    }
    loadPresets()
  }, [])
}
