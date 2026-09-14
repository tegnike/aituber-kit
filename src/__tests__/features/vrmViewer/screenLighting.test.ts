import {
  analyzeScreenLighting,
  getDisplayMediaOptions,
} from '@/features/vrmViewer/screenLighting'

describe('screen lighting', () => {
  it('extracts the color and luminance of a uniform frame', () => {
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
    ])

    const sample = analyzeScreenLighting(pixels, 2, 2)

    expect(sample.ambientColor).toEqual({ r: 1, g: 0, b: 0 })
    expect(sample.keyColor.r).toBeCloseTo(1)
    expect(sample.keyColor.g).toBeCloseTo(0)
    expect(sample.luminance).toBeCloseTo(0.2126)
    expect(sample.direction.x).toBeCloseTo(0)
    expect(sample.direction.y).toBeCloseTo(0)
  })

  it('points the key light toward a bright region', () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255, 0, 0, 0, 255,
    ])

    const sample = analyzeScreenLighting(pixels, 2, 2)

    expect(sample.direction.x).toBeGreaterThan(0.8)
    expect(sample.direction.y).toBeGreaterThan(0.8)
    expect(sample.keyLuminance).toBeGreaterThan(0.9)
  })

  it('returns a safe neutral sample for invalid input', () => {
    const sample = analyzeScreenLighting(new Uint8ClampedArray(), 0, 0)

    expect(sample).toEqual({
      ambientColor: { r: 1, g: 1, b: 1 },
      keyColor: { r: 1, g: 1, b: 1 },
      luminance: 1,
      keyLuminance: 1,
      direction: { x: 0, y: 0 },
    })
  })

  it('only restricts the chooser for a lighting-owned capture', () => {
    expect(getDisplayMediaOptions(false)).toEqual({ video: true })
    expect(getDisplayMediaOptions(true)).toMatchObject({
      video: { displaySurface: 'window' },
      audio: false,
      selfBrowserSurface: 'exclude',
      monitorTypeSurfaces: 'exclude',
      preferCurrentTab: false,
    })
  })
})
