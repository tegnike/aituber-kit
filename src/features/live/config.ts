// GPT-Live has a dedicated protocol; these are not Realtime API models.
export const LIVE_MODEL = 'gpt-live-1'
export const DEFAULT_LIVE_BACKEND = 'gpt-5.6-terra'
export const liveVoices = [
  'marin',
  'quartz',
  'ripple',
  'vesper',
  'willow',
  'stone',
  'gleam',
  'meridian',
  'bossa',
  'tempo',
  'beacon',
  'delta',
  'cinder',
] as const
export type LiveVoice = (typeof liveVoices)[number]

// Presentation in the official GPT-Live voice table; marin is not classified.
// https://developers.openai.com/api/docs/guides/live-conversations#voice-options
export const liveVoicePresentation: Record<
  LiveVoice,
  'Female' | 'Male' | 'Unspecified'
> = {
  marin: 'Unspecified',
  quartz: 'Female',
  ripple: 'Male',
  vesper: 'Male',
  willow: 'Female',
  stone: 'Male',
  gleam: 'Female',
  meridian: 'Male',
  bossa: 'Female',
  tempo: 'Male',
  beacon: 'Male',
  delta: 'Female',
  cinder: 'Male',
}
