export type Message = {
  role: string // "assistant" | "system" | "user";
  content?:
    | string
    | [{ type: 'text'; text: string }, { type: 'image'; image: string }] // マルチモーダル拡張
  audio?: { id: string }
  timestamp?: string
}

export const EMOTIONS = [
  'neutral',
  'happy',
  'angry',
  'sad',
  'relaxed',
  'surprised',
] as const
export type EmotionType = (typeof EMOTIONS)[number]

export type Talk = {
  emotion: EmotionType
  message: string
  buffer?: ArrayBuffer
}

export const splitSentence = (text: string): string[] => {
  const splitMessages = text.split(/(?<=[。．！？\n])/g)
  return splitMessages.filter((msg) => msg !== '')
}
