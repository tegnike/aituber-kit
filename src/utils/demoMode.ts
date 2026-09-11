// Public flag is shared by browser settings and server API guards.
export const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

type VoiceSettings = {
  liveMode?: boolean
  realtimeAPIMode?: boolean
  audioMode?: boolean
  selectVoice?: string
}

export function restrictDemoVoiceSettings<T extends VoiceSettings>(
  state: T
): T {
  if (!isDemoMode()) return state
  return {
    ...state,
    liveMode: false,
    realtimeAPIMode: false,
    audioMode: false,
    ...(state.selectVoice === 'openai'
      ? { selectVoice: 'aivis_cloud_api' }
      : {}),
  }
}
