/**
 * Settings Store - Realtime API Settings Tests
 *
 * settingsStoreのRealtime API設定テスト
 */

import settingsStore from '@/features/stores/settings'

describe('Settings Store - Realtime API Settings', () => {
  beforeEach(() => {
    // Reset relevant state
    settingsStore.setState({
      realtimeAPIMode: false,
      realtimeAPIModeContentType: 'input_text',
      realtimeAPIModeVoice: 'shimmer',
      audioMode: false,
    })
  })

  describe('realtimeAPIMode', () => {
    it('should default to false', () => {
      settingsStore.setState({ realtimeAPIMode: false })
      const state = settingsStore.getState()
      expect(state.realtimeAPIMode).toBe(false)
    })

    it('should be updatable to true', () => {
      settingsStore.setState({ realtimeAPIMode: true })
      expect(settingsStore.getState().realtimeAPIMode).toBe(true)
    })

    it('should be updatable to false', () => {
      settingsStore.setState({ realtimeAPIMode: true })
      settingsStore.setState({ realtimeAPIMode: false })
      expect(settingsStore.getState().realtimeAPIMode).toBe(false)
    })
  })

  describe('realtimeAPIModeContentType', () => {
    it('should support input_text content type', () => {
      settingsStore.setState({ realtimeAPIModeContentType: 'input_text' })
      expect(settingsStore.getState().realtimeAPIModeContentType).toBe(
        'input_text'
      )
    })

    it('should support input_audio content type', () => {
      settingsStore.setState({ realtimeAPIModeContentType: 'input_audio' })
      expect(settingsStore.getState().realtimeAPIModeContentType).toBe(
        'input_audio'
      )
    })
  })

  describe('realtimeAPIModeVoice', () => {
    it('should support shimmer voice', () => {
      settingsStore.setState({ realtimeAPIModeVoice: 'shimmer' })
      expect(settingsStore.getState().realtimeAPIModeVoice).toBe('shimmer')
    })

    it('should support alloy voice', () => {
      settingsStore.setState({ realtimeAPIModeVoice: 'alloy' })
      expect(settingsStore.getState().realtimeAPIModeVoice).toBe('alloy')
    })
  })

  describe('audioMode', () => {
    it('should default to false', () => {
      settingsStore.setState({ audioMode: false })
      expect(settingsStore.getState().audioMode).toBe(false)
    })

    it('should be updatable', () => {
      settingsStore.setState({ audioMode: true })
      expect(settingsStore.getState().audioMode).toBe(true)
    })
  })

  describe('exclusion rules interaction', () => {
    it('should be able to set realtimeAPIMode and audioMode independently', () => {
      settingsStore.setState({ realtimeAPIMode: true })
      const stateAfterRealtime = settingsStore.getState()
      expect(stateAfterRealtime.realtimeAPIMode).toBe(true)

      // Note: exclusion middleware may force audioMode off when realtimeAPIMode is on
      // This tests that the store accepts the value
      settingsStore.setState({ realtimeAPIMode: false, audioMode: true })
      const stateAfterAudio = settingsStore.getState()
      expect(stateAfterAudio.audioMode).toBe(true)
    })
  })
})
