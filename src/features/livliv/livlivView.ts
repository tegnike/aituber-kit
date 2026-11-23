import type { View } from '@livliv-dev/player'

export const LIVLIV_SCALE_MIN = 0.1
export const LIVLIV_SCALE_MAX = 3.0

export type LivLivPlacement = {
  /** 拡大率（1 が既定の大きさ） */
  scale: number
  /** 横の位置。キャンバスの幅に対する割合で、右が正 */
  offsetX: number
  /** 縦の位置。キャンバスの高さに対する割合で、上が正 */
  offsetY: number
}

export const clampLivLivScale = (scale: number) =>
  Number.isFinite(scale)
    ? Math.max(LIVLIV_SCALE_MIN, Math.min(LIVLIV_SCALE_MAX, scale))
    : 1

/** ホイール操作後の拡大率。PNGTuber と同じ感度にしている。 */
export const livlivScaleAfterWheel = (scale: number, deltaY: number) =>
  clampLivLivScale(scale + deltaY * -0.001)

/** ドラッグした画面上の距離（px）を、キャンバスに対する割合の位置へ直す。 */
export function livlivOffsetAfterDrag(
  start: Pick<LivLivPlacement, 'offsetX' | 'offsetY'>,
  dx: number,
  dy: number,
  width: number,
  height: number
): Pick<LivLivPlacement, 'offsetX' | 'offsetY'> {
  if (!(width > 0) || !(height > 0)) return start
  return {
    offsetX: start.offsetX + dx / width,
    offsetY: start.offsetY - dy / height,
  }
}

export function applyLivLivPlacement(
  view: Pick<View, 'x' | 'y' | 'zoom'>,
  { scale, offsetX, offsetY }: LivLivPlacement
) {
  view.zoom = clampLivLivScale(scale)
  view.x = Number.isFinite(offsetX) ? offsetX : 0
  view.y = Number.isFinite(offsetY) ? offsetY : 0
}
