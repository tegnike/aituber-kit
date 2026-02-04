/**
 * PNGTuber関連の型定義
 */

// 口の状態
export type MouthState = 'closed' | 'half' | 'open' | 'e' | 'u'

// 1フレームの口トラッキングデータ
export interface MouthTrackFrame {
  quad: [[number, number], [number, number], [number, number], [number, number]]
  valid: boolean
}

// キャリブレーション設定
export interface MouthTrackCalibration {
  offset: [number, number]
  scale: number
  rotation: number
}

// mouth_track.json全体の型
export interface MouthTrackData {
  fps: number
  width: number
  height: number
  refSpriteSize: [number, number]
  calibration: MouthTrackCalibration
  calibrationApplied: boolean
  frames: MouthTrackFrame[]
}

// 口スプライト画像のセット
export interface MouthSprites {
  closed: HTMLImageElement
  open: HTMLImageElement
  half?: HTMLImageElement
  e?: HTMLImageElement
  u?: HTMLImageElement
}

// 口スプライトURL（存在チェック用）
export interface MouthSpriteUrls {
  closed: string
  open: string
  half?: string
  e?: string
  u?: string
}

// PNGTuberアセット情報（APIレスポンス用）
export interface PNGTuberAsset {
  path: string
  name: string
  videoFile: string
  mouthTrack: string
  mouthSprites: {
    closed: string
    open: string
    half?: string
    e?: string
    u?: string
  }
}

// AudioWorkletからのデータ
export interface VolumeAnalyzerData {
  rms: number
  low: number
  high: number
}

// 音量閾値
export interface VolumeThresholds {
  closed: number
  half: number
}

// アフィン変換行列
export interface AffineMatrix {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

// PNGTuberEngine用の設定
export interface PNGTuberEngineConfig {
  sensitivity: number
}

// PNGTuberEngineのインターフェース（homeStore用）
export interface IPNGTuberEngine {
  loadAsset(assetPath: string): Promise<void>
  start(): void
  stop(): void
  setSensitivity(value: number): void
  setChromaKeySettings(enabled: boolean, color: string, tolerance: number): void
  playAudioFromBuffer(
    audioData: ArrayBuffer,
    isNeedDecode: boolean,
    onFinish?: () => void
  ): Promise<void>
  playAudioWithLipSync(
    audioBuffer: AudioBuffer,
    onFinish?: () => void
  ): Promise<void>
  stopAudio(): void
  resetMouth(): void
  destroy(): void
}
