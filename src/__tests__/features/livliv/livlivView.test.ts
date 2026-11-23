import {
  applyLivLivPlacement,
  clampLivLivScale,
  livlivOffsetAfterDrag,
  livlivScaleAfterWheel,
} from '@/features/livliv/livlivView'

describe('clampLivLivScale', () => {
  it('keeps the scale between 0.1 and 3', () => {
    expect(clampLivLivScale(0.01)).toBe(0.1)
    expect(clampLivLivScale(1.5)).toBe(1.5)
    expect(clampLivLivScale(10)).toBe(3)
  })

  it('falls back to 1 when the scale is not a number', () => {
    expect(clampLivLivScale(NaN)).toBe(1)
  })
})

describe('livlivScaleAfterWheel', () => {
  it('zooms in when the wheel scrolls up and out when it scrolls down', () => {
    expect(livlivScaleAfterWheel(1, -100)).toBeCloseTo(1.1)
    expect(livlivScaleAfterWheel(1, 100)).toBeCloseTo(0.9)
  })

  it('stops at the limits', () => {
    expect(livlivScaleAfterWheel(2.95, -1000)).toBe(3)
    expect(livlivScaleAfterWheel(0.15, 1000)).toBe(0.1)
  })
})

describe('livlivOffsetAfterDrag', () => {
  it('turns a drag in px into shares of the canvas, with y pointing up', () => {
    expect(
      livlivOffsetAfterDrag({ offsetX: 0.1, offsetY: 0 }, 200, 100, 1000, 500)
    ).toEqual({ offsetX: expect.closeTo(0.3), offsetY: expect.closeTo(-0.2) })
  })

  it('leaves the position alone when the canvas has no size', () => {
    const start = { offsetX: 0.1, offsetY: 0.2 }
    expect(livlivOffsetAfterDrag(start, 50, 50, 0, 0)).toBe(start)
  })
})

describe('applyLivLivPlacement', () => {
  it('writes the placement to the player view', () => {
    const view = { x: 0, y: 0, zoom: 1 }
    applyLivLivPlacement(view, { scale: 1.5, offsetX: 0.2, offsetY: -0.1 })
    expect(view).toEqual({ x: 0.2, y: -0.1, zoom: 1.5 })
  })

  it('ignores values that are not numbers', () => {
    const view = { x: 0.5, y: 0.5, zoom: 2 }
    applyLivLivPlacement(view, { scale: NaN, offsetX: NaN, offsetY: Infinity })
    expect(view).toEqual({ x: 0, y: 0, zoom: 1 })
  })
})
