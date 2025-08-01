// ボーン情報の型定義
export interface BoneData {
  position?: { x: number; y: number; z: number } // hipsのみ
  rotation: { x: number; y: number; z: number; w: number } // クォータニオン
  euler: { x: number; y: number; z: number } // オイラー角（度）
}

// ポーズデータの型定義
export interface PoseData {
  timestamp: number // アニメーション時間
  frame: number // フレーム番号
  bones: Record<string, BoneData> // ボーン名 -> データのマップ
}

// アニメーションフレームデータの型定義
export interface AnimationFrameData {
  frames: PoseData[]
  duration: number // 総時間（秒）
  fps: number // フレームレート
  name?: string // アニメーション名
}