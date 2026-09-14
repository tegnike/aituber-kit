export type ScreenLightingColor = {
  r: number
  g: number
  b: number
}

export type ScreenLightingSample = {
  ambientColor: ScreenLightingColor
  keyColor: ScreenLightingColor
  luminance: number
  keyLuminance: number
  direction: {
    x: number
    y: number
  }
}

const DEFAULT_SAMPLE: ScreenLightingSample = {
  ambientColor: { r: 1, g: 1, b: 1 },
  keyColor: { r: 1, g: 1, b: 1 },
  luminance: 1,
  keyLuminance: 1,
  direction: { x: 0, y: 0 },
}

const SCREEN_LIGHTING_DISPLAY_MEDIA_OPTIONS = {
  video: { displaySurface: 'window' },
  audio: false,
  selfBrowserSurface: 'exclude',
  monitorTypeSurfaces: 'exclude',
  surfaceSwitching: 'include',
  preferCurrentTab: false,
} as DisplayMediaStreamOptions

export const getDisplayMediaOptions = (
  screenLightingCaptureOwned: boolean
): DisplayMediaStreamOptions =>
  screenLightingCaptureOwned
    ? SCREEN_LIGHTING_DISPLAY_MEDIA_OPTIONS
    : { video: true }

const getLuminance = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b

/**
 * 小さく縮小した画面キャプチャから、VRM照明に必要な代表色と光源方向を求める。
 * 明るい画素ほどキーライトへの寄与を大きくし、暗い画面でも方向が暴れないよう
 * 微小な基礎ウェイトを加える。
 */
export const analyzeScreenLighting = (
  pixels: ArrayLike<number>,
  width: number,
  height: number
): ScreenLightingSample => {
  const pixelCount = width * height
  if (width <= 0 || height <= 0 || pixels.length < pixelCount * 4) {
    return DEFAULT_SAMPLE
  }

  let visiblePixels = 0
  let ambientR = 0
  let ambientG = 0
  let ambientB = 0
  let ambientLuminance = 0
  let keyR = 0
  let keyG = 0
  let keyB = 0
  let keyLuminance = 0
  let keyWeightTotal = 0
  let weightedX = 0
  let weightedY = 0

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4
    const alpha = pixels[offset + 3] / 255
    if (alpha <= 0) continue

    const r = (pixels[offset] / 255) * alpha
    const g = (pixels[offset + 1] / 255) * alpha
    const b = (pixels[offset + 2] / 255) * alpha
    const luminance = getLuminance(r, g, b)
    const keyWeight = 0.015 + luminance * luminance
    const x = width === 1 ? 0 : ((index % width) / (width - 1)) * 2 - 1
    const y =
      height === 1 ? 0 : 1 - (Math.floor(index / width) / (height - 1)) * 2

    visiblePixels += 1
    ambientR += r
    ambientG += g
    ambientB += b
    ambientLuminance += luminance
    keyR += r * keyWeight
    keyG += g * keyWeight
    keyB += b * keyWeight
    keyLuminance += luminance * keyWeight
    weightedX += x * keyWeight
    weightedY += y * keyWeight
    keyWeightTotal += keyWeight
  }

  if (visiblePixels === 0 || keyWeightTotal === 0) {
    return DEFAULT_SAMPLE
  }

  return {
    ambientColor: {
      r: ambientR / visiblePixels,
      g: ambientG / visiblePixels,
      b: ambientB / visiblePixels,
    },
    keyColor: {
      r: keyR / keyWeightTotal,
      g: keyG / keyWeightTotal,
      b: keyB / keyWeightTotal,
    },
    luminance: ambientLuminance / visiblePixels,
    keyLuminance: keyLuminance / keyWeightTotal,
    direction: {
      x: weightedX / keyWeightTotal,
      y: weightedY / keyWeightTotal,
    },
  }
}
