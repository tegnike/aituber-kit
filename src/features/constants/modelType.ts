export const CHARACTER_MODEL_TYPES = [
  'vrm',
  'live2d',
  'pngtuber',
  'livliv',
] as const

export type CharacterModelType = (typeof CHARACTER_MODEL_TYPES)[number]

export const isCharacterModelType = (
  value: unknown
): value is CharacterModelType =>
  typeof value === 'string' &&
  (CHARACTER_MODEL_TYPES as readonly string[]).includes(value)
