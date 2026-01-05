/**
 * Presence Detection Types
 *
 * 人感検知機能で使用する型定義
 */

// 検知状態の定数配列
export const PRESENCE_STATES = [
  'idle',
  'detected',
  'greeting',
  'conversation-ready',
] as const

// 検知状態の型
export type PresenceState = (typeof PRESENCE_STATES)[number]

// エラーコードの定数配列
export const PRESENCE_ERROR_CODES = [
  'CAMERA_PERMISSION_DENIED',
  'CAMERA_NOT_AVAILABLE',
  'MODEL_LOAD_FAILED',
] as const

// エラーコードの型
export type PresenceErrorCode = (typeof PRESENCE_ERROR_CODES)[number]

// エラー情報
export interface PresenceError {
  code: PresenceErrorCode
  message: string
}

// 境界ボックス
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// 検出結果
export interface DetectionResult {
  faceDetected: boolean
  confidence: number
  boundingBox?: BoundingBox
}

// 型ガード関数
export function isPresenceState(value: unknown): value is PresenceState {
  return (
    typeof value === 'string' &&
    PRESENCE_STATES.includes(value as PresenceState)
  )
}

export function isPresenceErrorCode(
  value: unknown
): value is PresenceErrorCode {
  return (
    typeof value === 'string' &&
    PRESENCE_ERROR_CODES.includes(value as PresenceErrorCode)
  )
}
