import { useEffect } from 'react'
import settingsStore from '@/features/stores/settings'

export const useTheme = () => {
  const colorTheme = settingsStore((s) => s.colorTheme)

  useEffect(() => {
    // 初期テーマを適用
    document.documentElement.setAttribute('data-theme', colorTheme)
  }, [colorTheme])

  const setTheme = (
    theme: 'default' | 'cool' | 'mono' | 'ocean' | 'forest' | 'sunset'
  ) => {
    settingsStore.setState({ colorTheme: theme })
    document.documentElement.setAttribute('data-theme', theme)
  }

  return { colorTheme, setTheme }
}
