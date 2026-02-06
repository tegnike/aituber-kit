/**
 * Idle Mode Types
 *
 * Type definitions and constants for the idle mode feature
 */

// Playback modes for idle phrases
export const IDLE_PLAYBACK_MODES = ['sequential', 'random'] as const
export type IdlePlaybackMode = (typeof IDLE_PLAYBACK_MODES)[number]

// Type guard for IdlePlaybackMode
export function isIdlePlaybackMode(value: unknown): value is IdlePlaybackMode {
  return (
    typeof value === 'string' &&
    IDLE_PLAYBACK_MODES.includes(value as IdlePlaybackMode)
  )
}

// Emotion types (reusing existing emotion types from the app)
export type EmotionType =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'relaxed'
  | 'surprised'

// Idle phrase structure
export interface IdlePhrase {
  id: string
  text: string
  emotion: EmotionType
  order: number
}

// Factory function to create an idle phrase with auto-generated id
export function createIdlePhrase(
  text: string,
  emotion: EmotionType,
  order: number
): IdlePhrase {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `phrase-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    text,
    emotion,
    order,
  }
}

// Complete idle mode settings interface
export interface IdleModeSettings {
  // Core settings
  idleModeEnabled: boolean
  idlePhrases: IdlePhrase[]
  idlePlaybackMode: IdlePlaybackMode
  idleInterval: number // seconds (10-300)
  idleDefaultEmotion: EmotionType

  // Time period greeting settings (optional feature)
  idleTimePeriodEnabled: boolean
  idleTimePeriodMorning: string
  idleTimePeriodMorningEmotion: EmotionType
  idleTimePeriodAfternoon: string
  idleTimePeriodAfternoonEmotion: EmotionType
  idleTimePeriodEvening: string
  idleTimePeriodEveningEmotion: EmotionType

  // AI generation settings (optional feature)
  idleAiGenerationEnabled: boolean
  idleAiPromptTemplate: string
}

// Default configuration
export const DEFAULT_IDLE_CONFIG: IdleModeSettings = {
  idleModeEnabled: false,
  idlePhrases: [],
  idlePlaybackMode: 'sequential',
  idleInterval: 30,
  idleDefaultEmotion: 'neutral',
  idleTimePeriodEnabled: false,
  idleTimePeriodMorning: 'おはようございます！',
  idleTimePeriodMorningEmotion: 'happy',
  idleTimePeriodAfternoon: 'こんにちは！',
  idleTimePeriodAfternoonEmotion: 'happy',
  idleTimePeriodEvening: 'こんばんは！',
  idleTimePeriodEveningEmotion: 'relaxed',
  idleAiGenerationEnabled: false,
  idleAiPromptTemplate: '',
}

// Interval validation constants
export const IDLE_INTERVAL_MIN = 10
export const IDLE_INTERVAL_MAX = 300

// Validate and clamp interval value
export function clampIdleInterval(value: number): number {
  if (value < IDLE_INTERVAL_MIN) return IDLE_INTERVAL_MIN
  if (value > IDLE_INTERVAL_MAX) return IDLE_INTERVAL_MAX
  return value
}
