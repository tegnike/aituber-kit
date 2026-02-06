/**
 * Infinite Loop Prevention Tests
 *
 * useEffect/状態更新の無限ループ検証
 */

import settingsStore from '@/features/stores/settings'
import homeStore from '@/features/stores/home'

describe('Infinite Loop Prevention', () => {
  describe('settingsStore state updates', () => {
    it('should not cause cascading updates when setting kioskModeEnabled', () => {
      const updates: string[] = []
      const unsubscribe = settingsStore.subscribe((state, prevState) => {
        updates.push('settings-updated')
      })

      settingsStore.setState({ kioskModeEnabled: true })

      // Should only trigger one update, not a cascade
      expect(updates.length).toBe(1)

      unsubscribe()
    })

    it('should not cause cascading updates when setting realtimeAPIMode', () => {
      const updates: string[] = []
      const unsubscribe = settingsStore.subscribe(() => {
        updates.push('settings-updated')
      })

      settingsStore.setState({ realtimeAPIMode: true })

      // Exclusion middleware may trigger additional updates, but should be finite
      expect(updates.length).toBeLessThanOrEqual(3)

      settingsStore.setState({ realtimeAPIMode: false })
      unsubscribe()
    })

    it('should not trigger infinite subscribe callbacks on rapid state changes', () => {
      let callCount = 0
      const unsubscribe = settingsStore.subscribe(() => {
        callCount++
      })

      // Rapid state changes
      for (let i = 0; i < 10; i++) {
        settingsStore.setState({ voicevoxSpeed: 1 + i * 0.1 })
      }

      // Each setState should trigger exactly one callback (plus possible middleware)
      expect(callCount).toBeLessThanOrEqual(30)
      expect(callCount).toBeGreaterThanOrEqual(10)

      unsubscribe()
    })
  })

  describe('homeStore state updates', () => {
    it('should not cause cascading updates when setting chatProcessing', () => {
      const updates: string[] = []
      const unsubscribe = homeStore.subscribe(() => {
        updates.push('home-updated')
      })

      homeStore.setState({ chatProcessing: true })

      expect(updates.length).toBe(1)

      homeStore.setState({ chatProcessing: false })
      unsubscribe()
    })

    it('should not cause cascading updates when setting isSpeaking', () => {
      const updates: string[] = []
      const unsubscribe = homeStore.subscribe(() => {
        updates.push('home-updated')
      })

      homeStore.setState({ isSpeaking: true })

      expect(updates.length).toBe(1)

      homeStore.setState({ isSpeaking: false })
      unsubscribe()
    })
  })

  describe('cross-store interactions', () => {
    it('should handle sequential updates across stores without loops', () => {
      const settingsUpdates: number[] = []
      const homeUpdates: number[] = []

      const unsubSettings = settingsStore.subscribe(() => {
        settingsUpdates.push(Date.now())
      })
      const unsubHome = homeStore.subscribe(() => {
        homeUpdates.push(Date.now())
      })

      // Simulate a flow: settings change -> home change
      settingsStore.setState({ youtubeMode: true })
      homeStore.setState({ chatProcessing: true })

      expect(settingsUpdates.length).toBe(1)
      expect(homeUpdates.length).toBe(1)

      settingsStore.setState({ youtubeMode: false })
      homeStore.setState({ chatProcessing: false })

      unsubSettings()
      unsubHome()
    })
  })
})
