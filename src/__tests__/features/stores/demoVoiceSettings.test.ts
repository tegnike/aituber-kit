import settingsStore, {
  CURRENT_SETTINGS_VERSION,
} from '@/features/stores/settings'
const originalEnv = process.env
const initialState = settingsStore.getState()
beforeEach(() => {
  process.env = { ...originalEnv, NEXT_PUBLIC_DEMO_MODE: 'true' }
})
afterEach(() => {
  process.env = originalEnv
  settingsStore.setState(initialState, true)
  localStorage.clear()
})
test('demo rejects mode changes without changing external agent or Aivis settings', () => {
  settingsStore.setState({
    selectAIService: 'custom-api',
    selectVoice: 'aivis_cloud_api',
  })
  for (const mode of ['liveMode', 'realtimeAPIMode', 'audioMode'] as const) {
    settingsStore.setState({ [mode]: true })
    expect(settingsStore.getState()[mode]).toBe(false)
    expect(settingsStore.getState().selectAIService).toBe('custom-api')
    expect(settingsStore.getState().selectVoice).toBe('aivis_cloud_api')
  }
  settingsStore.setState({ selectVoice: 'openai' })
  expect(settingsStore.getState().selectVoice).toBe('aivis_cloud_api')
})
test('persisted demo settings cannot restore disabled voice modes', async () => {
  localStorage.setItem(
    'aitube-kit-settings',
    JSON.stringify({
      version: CURRENT_SETTINGS_VERSION,
      state: {
        liveMode: true,
        realtimeAPIMode: true,
        audioMode: true,
        selectVoice: 'openai',
        selectAIService: 'custom-api',
        youtubeMode: true,
      },
    })
  )
  await settingsStore.persist.rehydrate()
  expect(settingsStore.getState()).toMatchObject({
    liveMode: false,
    realtimeAPIMode: false,
    audioMode: false,
    selectVoice: 'aivis_cloud_api',
    selectAIService: 'custom-api',
    youtubeMode: true,
  })
})
