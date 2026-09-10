import settingsStore, {
  CURRENT_SETTINGS_VERSION,
  selectPersistedSettings,
} from '@/features/stores/settings'

afterEach(() => {
  settingsStore.setState({ liveMode: false })
  localStorage.clear()
})
test('Live settings are included in backup/persistence', () => {
  settingsStore.setState({
    liveMode: true,
    liveVoice: 'quartz',
    liveBackendModel: 'gpt-5.6-terra',
    liveWebSearch: true,
  })
  expect(selectPersistedSettings(settingsStore.getState())).toMatchObject({
    liveMode: true,
    liveVoice: 'quartz',
    liveBackendModel: 'gpt-5.6-terra',
    liveWebSearch: true,
  })
})
test('restored Live mode disables competing microphones and automatic speech', async () => {
  localStorage.setItem(
    'aitube-kit-settings',
    JSON.stringify({
      version: CURRENT_SETTINGS_VERSION,
      state: {
        liveMode: true,
        realtimeAPIMode: true,
        audioMode: true,
        youtubeMode: true,
        idleModeEnabled: true,
        speechRecognitionMode: 'live-transcription',
      },
    })
  )
  await settingsStore.persist.rehydrate()
  expect(settingsStore.getState()).toMatchObject({
    liveMode: true,
    realtimeAPIMode: false,
    audioMode: false,
    youtubeMode: false,
    idleModeEnabled: false,
    speechRecognitionMode: 'browser',
  })
})
