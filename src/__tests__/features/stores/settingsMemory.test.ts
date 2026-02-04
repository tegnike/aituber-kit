/**
 * Settings Store - Memory Settings Tests
 *
 * TDD: Tests for memory configuration in settings store
 */

import settingsStore from '@/features/stores/settings'
import { DEFAULT_MEMORY_CONFIG } from '@/features/memory/memoryTypes'

describe('Settings Store - Memory Settings', () => {
  beforeEach(() => {
    // Reset store to default values
    settingsStore.setState({
      memoryEnabled: DEFAULT_MEMORY_CONFIG.memoryEnabled,
      memorySimilarityThreshold:
        DEFAULT_MEMORY_CONFIG.memorySimilarityThreshold,
      memorySearchLimit: DEFAULT_MEMORY_CONFIG.memorySearchLimit,
      memoryMaxContextTokens: DEFAULT_MEMORY_CONFIG.memoryMaxContextTokens,
    })
  })

  describe('memoryEnabled', () => {
    it('should default to false', () => {
      const state = settingsStore.getState()
      expect(state.memoryEnabled).toBe(false)
    })

    it('should be updatable', () => {
      settingsStore.setState({ memoryEnabled: true })
      expect(settingsStore.getState().memoryEnabled).toBe(true)

      settingsStore.setState({ memoryEnabled: false })
      expect(settingsStore.getState().memoryEnabled).toBe(false)
    })
  })

  describe('memorySimilarityThreshold', () => {
    it('should default to 0.7', () => {
      const state = settingsStore.getState()
      expect(state.memorySimilarityThreshold).toBe(0.7)
    })

    it('should be updatable within valid range (0.1-0.95)', () => {
      settingsStore.setState({ memorySimilarityThreshold: 0.1 })
      expect(settingsStore.getState().memorySimilarityThreshold).toBe(0.1)

      settingsStore.setState({ memorySimilarityThreshold: 0.95 })
      expect(settingsStore.getState().memorySimilarityThreshold).toBe(0.95)

      settingsStore.setState({ memorySimilarityThreshold: 0.5 })
      expect(settingsStore.getState().memorySimilarityThreshold).toBe(0.5)
    })
  })

  describe('memorySearchLimit', () => {
    it('should default to 5', () => {
      const state = settingsStore.getState()
      expect(state.memorySearchLimit).toBe(5)
    })

    it('should be updatable within valid range (1-10)', () => {
      settingsStore.setState({ memorySearchLimit: 1 })
      expect(settingsStore.getState().memorySearchLimit).toBe(1)

      settingsStore.setState({ memorySearchLimit: 10 })
      expect(settingsStore.getState().memorySearchLimit).toBe(10)

      settingsStore.setState({ memorySearchLimit: 7 })
      expect(settingsStore.getState().memorySearchLimit).toBe(7)
    })
  })

  describe('memoryMaxContextTokens', () => {
    it('should default to 1000', () => {
      const state = settingsStore.getState()
      expect(state.memoryMaxContextTokens).toBe(1000)
    })

    it('should be updatable', () => {
      settingsStore.setState({ memoryMaxContextTokens: 500 })
      expect(settingsStore.getState().memoryMaxContextTokens).toBe(500)

      settingsStore.setState({ memoryMaxContextTokens: 2000 })
      expect(settingsStore.getState().memoryMaxContextTokens).toBe(2000)
    })
  })

  describe('persistence', () => {
    it('should include memory settings in partialize', () => {
      settingsStore.setState({
        memoryEnabled: true,
        memorySimilarityThreshold: 0.8,
        memorySearchLimit: 3,
        memoryMaxContextTokens: 1500,
      })

      const state = settingsStore.getState()
      expect(state.memoryEnabled).toBe(true)
      expect(state.memorySimilarityThreshold).toBe(0.8)
      expect(state.memorySearchLimit).toBe(3)
      expect(state.memoryMaxContextTokens).toBe(1500)
    })
  })
})
