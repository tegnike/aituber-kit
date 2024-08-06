export type KoeiroParam = {
  speakerX: number
  speakerY: number
}

export const DEFAULT_PARAM: KoeiroParam = {
  speakerX: 3,
  speakerY: 3,
} as const

export const PRESET_A: KoeiroParam = {
  speakerX: 4.5,
  speakerY: 10,
} as const

export const PRESET_B: KoeiroParam = {
  speakerX: 3,
  speakerY: 3,
} as const

export const PRESET_C: KoeiroParam = {
  speakerX: -5.5,
  speakerY: -3,
} as const

export const PRESET_D: KoeiroParam = {
  speakerX: 3.5,
  speakerY: -8,
} as const
