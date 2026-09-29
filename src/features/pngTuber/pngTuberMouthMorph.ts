import { MouthSprites, MouthState } from './pngTuberTypes'

const NAMES: MouthState[] = ['closed', 'half', 'open', 'e', 'u']
const TAU_SECONDS = 0.045
const EPSILON = 0.0005

type Source = {
  image: HTMLImageElement
  data: Uint8ClampedArray
  left: number
  right: number
  upper: number[]
  lower: number[]
}

export interface PNGTuberMouthMorph {
  readonly canvas: HTMLCanvasElement
  frame(state: MouthState, deltaSeconds: number): HTMLCanvasElement
  reset(state?: MouthState): HTMLCanvasElement
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

const dimensions = (image: HTMLImageElement): [number, number] => [
  image.naturalWidth || image.width,
  image.naturalHeight || image.height,
]

const smoothProfile = (values: number[]) => {
  const valid = values.flatMap((value, index) =>
    Number.isFinite(value) ? [index] : []
  )
  if (!valid.length) return values.map(() => 0)
  for (let i = 0; i < valid[0]; i++) values[i] = values[valid[0]]
  for (let i = valid.length - 1; i >= 0; i--) {
    const left = valid[i]
    const right = valid[i + 1]
    if (right === undefined) {
      for (let x = left + 1; x < values.length; x++) values[x] = values[left]
      continue
    }
    for (let x = left + 1; x < right; x++) {
      values[x] =
        values[left] +
        ((values[right] - values[left]) * (x - left)) / (right - left)
    }
  }
  return values
}

const at = (values: number[], x: number) => {
  const lo = clamp(Math.floor(x), 0, values.length - 1)
  const hi = clamp(lo + 1, 0, values.length - 1)
  return values[lo] + (values[hi] - values[lo]) * (x - lo)
}

const weightsFor = (state: MouthState) =>
  Object.fromEntries(
    NAMES.map((name) => [name, name === state ? 1 : 0])
  ) as Record<MouthState, number>

const analyze = (image: HTMLImageElement): Source | null => {
  const [width, height] = dimensions(image)
  if (width !== 256 || height !== 256) return null
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, width, height).data
  let left = width
  let right = -1
  const upper = new Array<number>(width)
  const lower = new Array<number>(width)
  for (let x = 0; x < width; x++) {
    let y0 = height
    let y1 = -1
    for (let y = 0; y < height; y++) {
      if (pixels[(y * width + x) * 4 + 3] > 8) {
        y0 = Math.min(y0, y)
        y1 = y
        left = Math.min(left, x)
        right = Math.max(right, x)
      }
    }
    if (y1 >= 0) {
      upper[x] = y0
      lower[x] = y1
    }
  }
  if (right < left) return null
  return {
    image,
    data: pixels,
    left,
    right,
    upper: smoothProfile(upper),
    lower: smoothProfile(lower),
  }
}

// RGBAをpremultiplied alphaとして補間し、透明な縁のRGBが混ざらないようにする。
const sample = (source: Source, x: number, y: number) => {
  x = clamp(x, 0, 255)
  y = clamp(y, 0, 255)
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(x0 + 1, 255)
  const y1 = Math.min(y0 + 1, 255)
  const fx = x - x0
  const fy = y - y0
  const read = (xx: number, yy: number, channel: number) =>
    source.data[(yy * 256 + xx) * 4 + channel]
  const mixed = (channel: (xx: number, yy: number) => number) => {
    const a = channel(x0, y0) * (1 - fx) + channel(x1, y0) * fx
    const b = channel(x0, y1) * (1 - fx) + channel(x1, y1) * fx
    return a * (1 - fy) + b * fy
  }
  const alpha = mixed((xx, yy) => read(xx, yy, 3) / 255)
  return [
    mixed((xx, yy) => (read(xx, yy, 0) / 255) * (read(xx, yy, 3) / 255)),
    mixed((xx, yy) => (read(xx, yy, 1) / 255) * (read(xx, yy, 3) / 255)),
    mixed((xx, yy) => (read(xx, yy, 2) / 255) * (read(xx, yy, 3) / 255)),
    alpha,
  ]
}

/**
 * 5種類すべての256px口スプライトがそろう時だけ連続モーフを作る。
 * 既存アセットへの互換性のため、条件を満たさなければ呼び出し側は従来描画へ戻す。
 */
export const createPNGTuberMouthMorph = (
  sprites: Partial<MouthSprites>
): PNGTuberMouthMorph | null => {
  const sources = {} as Record<MouthState, Source>
  // 欠損・サイズ不一致のアセットでは、解析用canvasすら作らず従来経路へ戻す。
  for (const name of NAMES) {
    const sprite = sprites[name]
    if (
      !sprite ||
      dimensions(sprite)[0] !== 256 ||
      dimensions(sprite)[1] !== 256
    ) {
      return null
    }
  }
  for (const name of NAMES) {
    const source = analyze(sprites[name]!)
    if (!source) return null
    sources[name] = source
  }

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  const output = context.createImageData(256, 256)
  let weights = weightsFor('closed')

  const endpoint = (state: MouthState) => {
    context.clearRect(0, 0, 256, 256)
    context.drawImage(sources[state].image, 0, 0)
    return canvas
  }

  const render = () => {
    const active = NAMES.filter((name) => weights[name] > 0.000001)
    if (active.length === 1 && weights[active[0]] > 1 - EPSILON)
      return endpoint(active[0])
    const data = output.data
    data.fill(0)
    let commonLeft = 0
    let commonRight = 0
    for (const name of active) {
      commonLeft += sources[name].left * weights[name]
      commonRight += sources[name].right * weights[name]
    }
    for (
      let ox = Math.floor(commonLeft) - 1;
      ox <= Math.ceil(commonRight) + 1;
      ox++
    ) {
      if (ox < 0 || ox > 255) continue
      const u = clamp(
        (ox - commonLeft) / Math.max(1, commonRight - commonLeft),
        0,
        1
      )
      const boxes = active.map((name) => {
        const source = sources[name]
        const sx = source.left + u * (source.right - source.left)
        return {
          name,
          source,
          sx,
          top: at(source.upper, sx),
          bottom: at(source.lower, sx),
        }
      })
      let top = 0
      let bottom = 0
      for (const box of boxes) {
        top += box.top * weights[box.name]
        bottom += box.bottom * weights[box.name]
      }
      if (bottom <= top) continue
      for (
        let oy = Math.max(0, Math.floor(top) - 1);
        oy <= Math.min(255, Math.ceil(bottom) + 1);
        oy++
      ) {
        const v = clamp((oy - top) / Math.max(1, bottom - top), 0, 1)
        let pr = 0
        let pg = 0
        let pb = 0
        let pa = 0
        for (const box of boxes) {
          const [r, g, b, a] = sample(
            box.source,
            box.sx,
            box.top + v * (box.bottom - box.top)
          )
          const weight = weights[box.name]
          pr += r * weight
          pg += g * weight
          pb += b * weight
          pa += a * weight
        }
        if (pa <= 0) continue
        const index = (oy * 256 + ox) * 4
        data[index] = clamp(Math.round((pr / pa) * 255), 0, 255)
        data[index + 1] = clamp(Math.round((pg / pa) * 255), 0, 255)
        data[index + 2] = clamp(Math.round((pb / pa) * 255), 0, 255)
        data[index + 3] = clamp(Math.round(pa * 255), 0, 255)
      }
    }
    context.putImageData(output, 0, 0)
    return canvas
  }

  return {
    canvas,
    frame(state, deltaSeconds) {
      const target = weightsFor(state)
      const dt =
        Number.isFinite(deltaSeconds) && deltaSeconds > 0
          ? Math.min(deltaSeconds, 0.05)
          : 0
      const amount = 1 - Math.exp(-dt / TAU_SECONDS)
      for (const name of NAMES)
        weights[name] += (target[name] - weights[name]) * amount
      if (Math.abs(weights[state] - 1) < EPSILON) weights = target
      return render()
    },
    reset(state = 'closed') {
      weights = weightsFor(state)
      return endpoint(state)
    },
  }
}
