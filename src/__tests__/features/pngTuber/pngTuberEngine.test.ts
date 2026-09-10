/**
 * PNGTuber純粋関数テスト
 *
 * 決定的・副作用なしの関数群（アフィン行列計算、キャリブレーション、
 * 色変換、口形状選択、閾値計算）は pngTuberMath.ts から直接インポートして検証する。
 * エンジンインスタンスの内部状態を扱うテストのみ PNGTuberEngine を使用する。
 */

import {
  computeAffine,
  applyCalibrationToQuad,
  hexToRGB,
  getVolumeThresholds,
  getVolumeThresholdsHQ,
  selectMouthState,
  selectMouthStateHQ,
} from '@/features/pngTuber/pngTuberMath'
import { PNGTuberEngine } from '@/features/pngTuber/pngTuberEngine'
import {
  MouthState,
  MouthTrackData,
  MouthSpriteUrls,
  VolumeThresholds,
} from '@/features/pngTuber/pngTuberTypes'

type Point = [number, number]
type Quad = [Point, Point, Point, Point]

describe('pngTuberMath 純粋関数', () => {
  describe('computeAffine', () => {
    it('恒等変換では単位行列を返す', () => {
      const mat = computeAffine(
        [0, 0],
        [10, 0],
        [0, 10],
        [0, 0],
        [10, 0],
        [0, 10]
      )
      expect(mat).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })
    })

    it('平行移動のみの場合はe/fに移動量が入る', () => {
      const mat = computeAffine(
        [0, 0],
        [10, 0],
        [0, 10],
        [5, -3],
        [15, -3],
        [5, 7]
      )
      expect(mat).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 5, f: -3 })
    })

    it('拡大のみの場合はa/dにスケールが入る', () => {
      const mat = computeAffine(
        [0, 0],
        [10, 0],
        [0, 10],
        [0, 0],
        [20, 0],
        [0, 30]
      )
      expect(mat).toEqual({ a: 2, b: 0, c: 0, d: 3, e: 0, f: 0 })
    })

    it('90度回転を表現できる', () => {
      // (1,0)→(0,1), (0,1)→(-1,0) の回転
      const mat = computeAffine([0, 0], [1, 0], [0, 1], [0, 0], [0, 1], [-1, 0])
      expect(mat).not.toBeNull()
      expect(mat!.a).toBeCloseTo(0)
      expect(mat!.b).toBeCloseTo(1)
      expect(mat!.c).toBeCloseTo(-1)
      expect(mat!.d).toBeCloseTo(0)
      expect(mat!.e).toBeCloseTo(0)
      expect(mat!.f).toBeCloseTo(0)
    })

    it('手計算例と一致する', () => {
      // s0=(0,0), s1=(2,0), s2=(0,2) → d0=(1,1), d1=(5,2), d2=(2,4)
      // x軸ベクトル(2,0)→(4,1)より a=2, b=0.5
      // y軸ベクトル(0,2)→(1,3)より c=0.5, d=1.5
      // 原点(0,0)→(1,1)より e=1, f=1
      const mat = computeAffine([0, 0], [2, 0], [0, 2], [1, 1], [5, 2], [2, 4])
      expect(mat).toEqual({ a: 2, b: 0.5, c: 0.5, d: 1.5, e: 1, f: 1 })
    })

    it('計算した行列がソース各点をデスティネーションへ写像する', () => {
      const s: Point[] = [
        [3, 7],
        [12, 5],
        [8, 15],
      ]
      const d: Point[] = [
        [10, 20],
        [30, 25],
        [18, 40],
      ]
      const mat = computeAffine(s[0], s[1], s[2], d[0], d[1], d[2])
      expect(mat).not.toBeNull()
      // canvas変換: x' = a*x + c*y + e, y' = b*x + d*y + f
      for (let i = 0; i < 3; i++) {
        const [x, y] = s[i]
        expect(mat!.a * x + mat!.c * y + mat!.e).toBeCloseTo(d[i][0])
        expect(mat!.b * x + mat!.d * y + mat!.f).toBeCloseTo(d[i][1])
      }
    })

    it('ソース3点が一直線上（退化）の場合はnullを返す', () => {
      const mat = computeAffine([0, 0], [1, 1], [2, 2], [0, 0], [1, 0], [0, 1])
      expect(mat).toBeNull()
    })

    it('ソース3点が同一点の場合はnullを返す', () => {
      const mat = computeAffine([5, 5], [5, 5], [5, 5], [0, 0], [1, 0], [0, 1])
      expect(mat).toBeNull()
    })
  })

  describe('applyCalibrationToQuad', () => {
    const quad: Quad = [
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ]

    const makeData = (overrides: Partial<MouthTrackData>): MouthTrackData =>
      ({
        fps: 30,
        width: 100,
        height: 100,
        refSpriteSize: [10, 10],
        calibration: { offset: [0, 0], scale: 1, rotation: 0 },
        calibrationApplied: true,
        frames: [],
        ...overrides,
      }) as MouthTrackData

    it('calibrationAppliedがfalseの場合はコピーをそのまま返す', () => {
      const data = makeData({
        calibrationApplied: false,
        calibration: { offset: [10, 10], scale: 2, rotation: 90 },
      })
      const result = applyCalibrationToQuad(quad, data)
      expect(result).toEqual([
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
      ])
      // 新しい配列（元のquadと参照が異なる）
      expect(result).not.toBe(quad)
      expect(result[0]).not.toBe(quad[0])
    })

    it('calibrationが未定義の場合はデフォルト値（恒等変換）を使う', () => {
      const data = makeData({ calibration: undefined as any })
      const result = applyCalibrationToQuad(quad, data)
      result.forEach((pt, i) => {
        expect(pt[0]).toBeCloseTo(quad[i][0])
        expect(pt[1]).toBeCloseTo(quad[i][1])
      })
    })

    it('offsetのみの場合は平行移動する', () => {
      const data = makeData({
        calibration: { offset: [5, -3], scale: 1, rotation: 0 },
      })
      const result = applyCalibrationToQuad(quad, data)
      const expected = [
        [5, -3],
        [7, -3],
        [7, -1],
        [5, -1],
      ]
      result.forEach((pt, i) => {
        expect(pt[0]).toBeCloseTo(expected[i][0])
        expect(pt[1]).toBeCloseTo(expected[i][1])
      })
    })

    it('scaleは重心(1,1)を中心に拡大する', () => {
      const data = makeData({
        calibration: { offset: [0, 0], scale: 2, rotation: 0 },
      })
      const result = applyCalibrationToQuad(quad, data)
      const expected = [
        [-1, -1],
        [3, -1],
        [3, 3],
        [-1, 3],
      ]
      result.forEach((pt, i) => {
        expect(pt[0]).toBeCloseTo(expected[i][0])
        expect(pt[1]).toBeCloseTo(expected[i][1])
      })
    })

    it('rotationは重心を中心に度単位で回転する', () => {
      const data = makeData({
        calibration: { offset: [0, 0], scale: 1, rotation: 90 },
      })
      const result = applyCalibrationToQuad(quad, data)
      // 重心(1,1)を中心に90度回転: (0,0)→(2,0), (2,0)→(2,2), (2,2)→(0,2), (0,2)→(0,0)
      const expected = [
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0],
      ]
      result.forEach((pt, i) => {
        expect(pt[0]).toBeCloseTo(expected[i][0])
        expect(pt[1]).toBeCloseTo(expected[i][1])
      })
    })

    it('offset・scale・rotationを組み合わせて適用する', () => {
      const data = makeData({
        calibration: { offset: [10, 20], scale: 2, rotation: 180 },
      })
      const result = applyCalibrationToQuad(quad, data)
      // 重心(1,1)中心にスケール2 → 180度回転 → 平行移動(10,20)
      // (0,0): d=(-2,-2) → 回転で(2,2) → (1,1)+(10,20)+(2,2)=(13,23)
      const expected = [
        [13, 23],
        [9, 23],
        [9, 19],
        [13, 19],
      ]
      result.forEach((pt, i) => {
        expect(pt[0]).toBeCloseTo(expected[i][0])
        expect(pt[1]).toBeCloseTo(expected[i][1])
      })
    })
  })

  describe('hexToRGB', () => {
    it('#付き6桁カラーコードを変換する', () => {
      expect(hexToRGB('#FF0000')).toEqual([255, 0, 0])
      expect(hexToRGB('#00FF00')).toEqual([0, 255, 0])
      expect(hexToRGB('#0000FF')).toEqual([0, 0, 255])
      expect(hexToRGB('#123456')).toEqual([18, 52, 86])
    })

    it('#なしでも変換できる', () => {
      expect(hexToRGB('ffffff')).toEqual([255, 255, 255])
      expect(hexToRGB('000000')).toEqual([0, 0, 0])
    })

    it('大文字小文字を区別しない', () => {
      expect(hexToRGB('#AbCdEf')).toEqual([171, 205, 239])
      expect(hexToRGB('#abcdef')).toEqual([171, 205, 239])
    })

    it('不正な入力にはデフォルトのグリーンを返す', () => {
      expect(hexToRGB('')).toEqual([0, 255, 0])
      expect(hexToRGB('#fff')).toEqual([0, 255, 0]) // 3桁ショートハンド非対応
      expect(hexToRGB('invalid')).toEqual([0, 255, 0])
      expect(hexToRGB('#GGGGGG')).toEqual([0, 255, 0])
    })
  })

  describe('getVolumeThresholds / getVolumeThresholdsHQ', () => {
    it('デフォルト感度50での通常閾値', () => {
      // closed = 0.008 + 0.5 * 0.018 = 0.017, half = 0.02 + 0.5 * 0.06 = 0.05
      const t = getVolumeThresholds(50)
      expect(t.closed).toBeCloseTo(0.017)
      expect(t.half).toBeCloseTo(0.05)
    })

    it('デフォルト感度50でのHQ閾値', () => {
      // closed = 0.07 + 0.5 * 0.08 = 0.11, half = 0.22 + 0.5 * 0.12 = 0.28
      const t = getVolumeThresholdsHQ(50)
      expect(t.closed).toBeCloseTo(0.11)
      expect(t.half).toBeCloseTo(0.28)
    })

    it('感度100（最大）では閾値が最小になる', () => {
      const t = getVolumeThresholds(100)
      expect(t.closed).toBeCloseTo(0.008)
      expect(t.half).toBeCloseTo(0.02)
      const hq = getVolumeThresholdsHQ(100)
      expect(hq.closed).toBeCloseTo(0.07)
      expect(hq.half).toBeCloseTo(0.22)
    })

    it('感度0（最小）では閾値が最大になる', () => {
      const t = getVolumeThresholds(0)
      expect(t.closed).toBeCloseTo(0.026)
      expect(t.half).toBeCloseTo(0.08)
      const hq = getVolumeThresholdsHQ(0)
      expect(hq.closed).toBeCloseTo(0.15)
      expect(hq.half).toBeCloseTo(0.34)
    })

    it('感度が高いほど閾値が下がる（口が開きやすい）', () => {
      const low = getVolumeThresholds(20)
      const high = getVolumeThresholds(80)
      expect(high.closed).toBeLessThan(low.closed)
      expect(high.half).toBeLessThan(low.half)
    })
  })

  describe('selectMouthState', () => {
    // 感度50相当の閾値
    const thresholds: VolumeThresholds = { closed: 0.017, half: 0.05 }

    let spriteUrls: Partial<MouthSpriteUrls> = {}

    const select = (
      volume: number,
      highRatio: number,
      t: VolumeThresholds = thresholds
    ): MouthState => selectMouthState(volume, highRatio, t, spriteUrls)

    const setSpriteUrls = (urls: Partial<MouthSpriteUrls>) => {
      spriteUrls = urls
    }

    it('音量がclosed閾値未満なら closed', () => {
      setSpriteUrls({ closed: 'c', open: 'o', half: 'h', e: 'e', u: 'u' })
      expect(select(0, 0.5)).toBe('closed')
      expect(select(0.016, 0.5)).toBe('closed')
    })

    it('closed以上half未満でhalfスプライトがあれば half', () => {
      setSpriteUrls({ closed: 'c', open: 'o', half: 'h' })
      expect(select(0.03, 0.5)).toBe('half')
    })

    it('closed以上half未満でhalfスプライトがなければ open', () => {
      setSpriteUrls({ closed: 'c', open: 'o' })
      expect(select(0.03, 0.5)).toBe('open')
    })

    it('half以上で高周波比率が0.62超かつeスプライトがあれば e', () => {
      setSpriteUrls({ closed: 'c', open: 'o', e: 'e' })
      expect(select(0.1, 0.7)).toBe('e')
    })

    it('half以上で高周波比率が0.38未満かつuスプライトがあれば u', () => {
      setSpriteUrls({ closed: 'c', open: 'o', u: 'u' })
      expect(select(0.1, 0.2)).toBe('u')
    })

    it('e/uスプライトがない場合は open にフォールバックする', () => {
      setSpriteUrls({ closed: 'c', open: 'o' })
      expect(select(0.1, 0.7)).toBe('open')
      expect(select(0.1, 0.2)).toBe('open')
    })

    it('中間の高周波比率では open', () => {
      setSpriteUrls({ closed: 'c', open: 'o', e: 'e', u: 'u' })
      expect(select(0.1, 0.5)).toBe('open')
      // 境界値: 0.62と0.38ちょうどはopen
      expect(select(0.1, 0.62)).toBe('open')
      expect(select(0.1, 0.38)).toBe('open')
    })
  })

  describe('selectMouthStateHQ（ヒステリシス付き）', () => {
    // 感度50相当のHQ閾値: closed=0.11, half=0.28
    // closeTh = max(0.02, 0.11-0.03) = 0.08
    // halfDownTh = max(0.08+0.02, 0.28-0.02) = 0.26
    const thresholds: VolumeThresholds = { closed: 0.11, half: 0.28 }

    let currentState: MouthState = 'closed'
    let spriteUrls: Partial<MouthSpriteUrls> = {}

    const select = (
      level: number,
      highRatio: number,
      t: VolumeThresholds = thresholds
    ): MouthState =>
      selectMouthStateHQ(level, highRatio, t, currentState, spriteUrls)

    const setCurrentState = (state: MouthState) => {
      currentState = state
    }

    const setSpriteUrls = (urls: Partial<MouthSpriteUrls>) => {
      spriteUrls = urls
    }

    beforeEach(() => {
      setSpriteUrls({ closed: 'c', open: 'o', half: 'h', e: 'e', u: 'u' })
    })

    describe('closedからの遷移', () => {
      beforeEach(() => setCurrentState('closed'))

      it('half閾値以上で open', () => {
        expect(select(0.3, 0.5)).toBe('open')
      })

      it('closed閾値以上half閾値未満で half', () => {
        expect(select(0.15, 0.5)).toBe('half')
      })

      it('halfスプライトがない場合はclosed閾値以上で open', () => {
        setSpriteUrls({ closed: 'c', open: 'o' })
        expect(select(0.15, 0.5)).toBe('open')
      })

      it('closed閾値未満なら closed を維持', () => {
        expect(select(0.05, 0.5)).toBe('closed')
      })

      it('ヒステリシス: closeTh以上closed閾値未満でも開かない', () => {
        // 0.09はcloseTh(0.08)以上だがclosed閾値(0.11)未満 → closedのまま
        expect(select(0.09, 0.5)).toBe('closed')
      })
    })

    describe('halfからの遷移', () => {
      beforeEach(() => setCurrentState('half'))

      it('closeTh未満で closed に閉じる', () => {
        expect(select(0.07, 0.5)).toBe('closed')
      })

      it('ヒステリシス: closed閾値未満でもcloseTh以上なら half を維持', () => {
        // 0.09はclosed閾値(0.11)未満だがcloseTh(0.08)以上 → halfのまま
        expect(select(0.09, 0.5)).toBe('half')
      })

      it('half閾値以上で open', () => {
        expect(select(0.3, 0.5)).toBe('open')
      })

      it('中間レベルでは half を維持', () => {
        expect(select(0.2, 0.5)).toBe('half')
      })
    })

    describe('openからの遷移', () => {
      beforeEach(() => setCurrentState('open'))

      it('closeTh未満で closed に閉じる', () => {
        expect(select(0.05, 0.5)).toBe('closed')
      })

      it('halfDownTh未満で half に下がる', () => {
        // 0.2はhalfDownTh(0.26)未満 → half
        expect(select(0.2, 0.5)).toBe('half')
      })

      it('ヒステリシス: half閾値未満でもhalfDownTh以上なら open を維持', () => {
        // 0.27はhalf閾値(0.28)未満だがhalfDownTh(0.26)以上 → openのまま
        expect(select(0.27, 0.5)).toBe('open')
      })

      it('halfスプライトがない場合はhalfDownTh未満でも open を維持', () => {
        setSpriteUrls({ closed: 'c', open: 'o' })
        expect(select(0.2, 0.5)).toBe('open')
      })

      it('half閾値以上では open を維持', () => {
        expect(select(0.5, 0.5)).toBe('open')
      })
    })

    describe('母音判定（open時）', () => {
      beforeEach(() => setCurrentState('open'))

      it('高周波比率が0.62超なら e', () => {
        expect(select(0.5, 0.7)).toBe('e')
      })

      it('高周波比率が0.38未満なら u', () => {
        expect(select(0.5, 0.2)).toBe('u')
      })

      it('e/uスプライトがない場合は open のまま', () => {
        setSpriteUrls({ closed: 'c', open: 'o', half: 'h' })
        expect(select(0.5, 0.7)).toBe('open')
        expect(select(0.5, 0.2)).toBe('open')
      })

      it('closed状態には母音判定を適用しない', () => {
        expect(select(0.05, 0.7)).toBe('closed')
      })
    })

    describe('e/u状態はopenとして扱われる', () => {
      it('e状態から中間比率になると open に戻る', () => {
        setCurrentState('e')
        expect(select(0.5, 0.5)).toBe('open')
      })

      it('u状態から高い比率になると e に切り替わる', () => {
        setCurrentState('u')
        expect(select(0.5, 0.7)).toBe('e')
      })

      it('e状態でもcloseTh未満なら closed に閉じる', () => {
        setCurrentState('e')
        expect(select(0.05, 0.5)).toBe('closed')
      })
    })

    it('閾値が極端に低い場合closeThは0.02を下回らない', () => {
      setCurrentState('open')
      // thresholds.closed=0.03 → closeTh = max(0.02, 0) = 0.02
      const t: VolumeThresholds = { closed: 0.03, half: 0.1 }
      expect(select(0.019, 0.5, t)).toBe('closed')
      expect(select(0.021, 0.5, t)).not.toBe('closed')
    })
  })
})

describe('PNGTuberEngine インスタンス動作', () => {
  // privateフィールドの検証用に内部状態の型を宣言しておく
  // （プロパティ名はコンパイル時に保証されないが、as anyの散在を避けて一箇所に集約する）
  type EngineInternals = {
    mouthState: MouthState
    mouthSprites: Record<string, HTMLImageElement>
    lastMouthChange: number
    sensitivity: number
    chromaKeyEnabled: boolean
    chromaKeyTolerance: number
    chromaKeyRGB: [number, number, number]
    volume: number
    envelope: number
    noiseFloor: number
    levelPeak: number
    smoothedHighRatio: number
    resetAudioStats(): void
  }

  const internals = (e: PNGTuberEngine): EngineInternals =>
    e as unknown as EngineInternals

  const createEngine = (): PNGTuberEngine => {
    const video = document.createElement('video')
    const mainCanvas = document.createElement('canvas')
    const mouthCanvas = document.createElement('canvas')
    // jsdomのgetContextは未実装エラーを出すためnullを返すスタブに差し替える
    mainCanvas.getContext = jest.fn().mockReturnValue(null)
    mouthCanvas.getContext = jest.fn().mockReturnValue(null)
    return new PNGTuberEngine(video, mainCanvas, mouthCanvas)
  }

  let engine: PNGTuberEngine

  beforeEach(() => {
    engine = createEngine()
  })

  it('closes immediately on zero volume even inside the mouth transition interval', () => {
    const state = internals(engine)
    state.mouthSprites = {
      open: document.createElement('img'),
      closed: document.createElement('img'),
    }
    state.mouthState = 'open'
    state.lastMouthChange = performance.now()
    engine.setExternalAudioLevel(0)
    expect(state.mouthState).toBe('closed')
    const lastChange = state.lastMouthChange
    engine.setExternalAudioLevel(0)
    expect(state.lastMouthChange).toBe(lastChange)
  })

  describe('setSensitivity', () => {
    it('setSensitivityは0-100にクランプする', () => {
      engine.setSensitivity(150)
      expect(internals(engine).sensitivity).toBe(100)
      engine.setSensitivity(-10)
      expect(internals(engine).sensitivity).toBe(0)
    })
  })

  describe('setChromaKeySettings', () => {
    it('カラーコードからRGBを設定する', () => {
      engine.setChromaKeySettings(true, '#112233', 100)
      expect(internals(engine).chromaKeyRGB).toEqual([17, 34, 51])
      expect(internals(engine).chromaKeyEnabled).toBe(true)
      expect(internals(engine).chromaKeyTolerance).toBe(100)
    })

    it('toleranceを0-255にクランプする', () => {
      engine.setChromaKeySettings(false, '#000000', 300)
      expect(internals(engine).chromaKeyTolerance).toBe(255)
      engine.setChromaKeySettings(false, '#000000', -5)
      expect(internals(engine).chromaKeyTolerance).toBe(0)
    })
  })

  describe('resetAudioStats', () => {
    it('音声解析の統計を初期値に戻す', () => {
      const state = internals(engine)
      state.volume = 0.8
      state.envelope = 0.5
      state.noiseFloor = 0.1
      state.levelPeak = 0.9
      state.smoothedHighRatio = 0.7
      state.resetAudioStats()
      expect(state.volume).toBe(0)
      expect(state.envelope).toBe(0)
      expect(state.noiseFloor).toBe(0.002)
      expect(state.levelPeak).toBe(0.02)
      expect(state.smoothedHighRatio).toBe(0)
    })
  })
})
