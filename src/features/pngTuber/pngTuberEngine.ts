/**
 * PNGTuberEngine - リアルタイムリップシンクエンジン
 * MotionPNGTuber_Player/lipsync.js のTypeScript移植版
 */

import {
  MouthState,
  MouthTrackData,
  MouthSprites,
  MouthSpriteUrls,
  VolumeAnalyzerData,
  VolumeThresholds,
  AffineMatrix,
  IPNGTuberEngine,
} from './pngTuberTypes'

export class PNGTuberEngine implements IPNGTuberEngine {
  // DOM要素
  private video: HTMLVideoElement
  private mouthCanvas: HTMLCanvasElement
  private mouthCtx: CanvasRenderingContext2D | null

  // データ
  private trackData: MouthTrackData | null = null
  private mouthSprites: Partial<MouthSprites> = {}
  private mouthSpriteUrls: Partial<MouthSpriteUrls> = {}
  private activeSprite: HTMLImageElement | null = null

  // 音声関連
  private audioContext: AudioContext | null = null
  private workletNode: AudioWorkletNode | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private volume = 0
  private smoothedHighRatio = 0
  private sensitivity = 50

  // 口状態
  private mouthState: MouthState = 'closed'
  private lastMouthChange = 0
  private lastFrameIndex: number | null = null

  // ループ用
  private isRunning = false
  private animationId: number | null = null
  private resizeObserver: ResizeObserver | null = null

  // 再生完了コールバック
  private onAudioFinishCallback: (() => void) | null = null

  constructor(
    video: HTMLVideoElement,
    mouthCanvas: HTMLCanvasElement
  ) {
    this.video = video
    this.mouthCanvas = mouthCanvas
    this.mouthCtx = mouthCanvas.getContext('2d')
  }

  /**
   * アセットを読み込む
   */
  async loadAsset(assetPath: string): Promise<void> {
    try {
      // APIからアセット情報を取得
      const response = await fetch('/api/get-pngtuber-list')
      const assets = await response.json()
      const asset = assets.find((a: { path: string }) => a.path === assetPath)

      if (!asset) {
        throw new Error(`Asset not found: ${assetPath}`)
      }

      // 動画の読み込み
      const videoUrl = `${asset.path}/${asset.videoFile}`
      this.video.src = videoUrl
      this.video.loop = true
      this.video.muted = true
      this.video.playsInline = true
      this.video.preload = 'auto'
      this.video.controls = false

      await new Promise<void>((resolve, reject) => {
        const onReady = () => {
          this.video.removeEventListener('canplaythrough', onReady)
          this.video.removeEventListener('loadeddata', onReady)
          resolve()
        }
        this.video.addEventListener('canplaythrough', onReady)
        this.video.addEventListener('loadeddata', onReady)
        this.video.onerror = () => {
          reject(new Error('Failed to load video'))
        }
        this.video.load()
      })

      // キャンバスサイズを動画に合わせる
      this.mouthCanvas.width = this.video.videoWidth || 1
      this.mouthCanvas.height = this.video.videoHeight || 1
      if (this.mouthCtx) {
        this.mouthCtx.setTransform(1, 0, 0, 1, 0, 0)
        this.mouthCtx.imageSmoothingEnabled = true
        this.mouthCtx.clearRect(
          0,
          0,
          this.mouthCanvas.width,
          this.mouthCanvas.height
        )
      }

      // トラッキングデータの読み込み
      const trackResponse = await fetch(`${asset.path}/${asset.mouthTrack}`)
      this.trackData = await trackResponse.json()

      // 口スプライトの読み込み
      this.mouthSprites = {}
      this.mouthSpriteUrls = {}

      const spriteKeys: (keyof MouthSprites)[] = [
        'closed',
        'open',
        'half',
        'e',
        'u',
      ]
      for (const key of spriteKeys) {
        const spriteName = asset.mouthSprites[key]
        if (spriteName) {
          try {
            const img = await this.loadImage(
              `${asset.path}/mouth/${spriteName}`
            )
            this.mouthSprites[key] = img
            this.mouthSpriteUrls[key] = img.src
          } catch {
            // オプショナルなスプライトは読み込めなくてもOK
            if (key === 'closed' || key === 'open') {
              throw new Error(`Required sprite not found: ${key}`)
            }
          }
        }
      }

      // 初期状態をセット
      this.setMouthState('closed', true)

      console.log(
        `PNGTuber asset loaded: ${this.trackData?.frames.length} frames, ${this.trackData?.fps}fps`
      )
    } catch (error) {
      console.error('Failed to load PNGTuber asset:', error)
      throw error
    }
  }

  /**
   * 画像を読み込む
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  /**
   * AudioContextを初期化（TTS音声用）
   */
  async initAudioContext(): Promise<void> {
    if (this.audioContext) return

    this.audioContext = new AudioContext()

    // AudioWorkletを登録
    if (this.audioContext.audioWorklet) {
      await this.audioContext.audioWorklet.addModule(
        '/scripts/volume-analyzer-worklet.js'
      )
    }
  }

  /**
   * TTS音声を再生しながらリップシンク（ArrayBuffer版）
   * @param audioData 圧縮音声データまたはPCM16データ
   * @param isNeedDecode trueなら圧縮音声、falseならPCM16
   * @param onFinish 再生完了時のコールバック
   */
  async playAudioFromBuffer(
    audioData: ArrayBuffer,
    isNeedDecode: boolean,
    onFinish?: () => void
  ): Promise<void> {
    await this.initAudioContext()

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    let decodedAudio: AudioBuffer

    if (isNeedDecode) {
      // 圧縮音声の場合
      decodedAudio = await this.audioContext.decodeAudioData(audioData.slice(0))
    } else {
      // PCM16形式の場合
      const pcmData = new Int16Array(audioData)
      const floatData = new Float32Array(pcmData.length)
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] =
          pcmData[i] < 0 ? pcmData[i] / 32768.0 : pcmData[i] / 32767.0
      }
      // sampleRateは24000（Realtime APIのデフォルト）
      decodedAudio = this.audioContext.createBuffer(1, floatData.length, 24000)
      decodedAudio.getChannelData(0).set(floatData)
    }

    await this.playAudioWithLipSync(decodedAudio, onFinish)
  }

  /**
   * TTS音声を再生しながらリップシンク（AudioBuffer版）
   */
  async playAudioWithLipSync(
    audioBuffer: AudioBuffer,
    onFinish?: () => void
  ): Promise<void> {
    await this.initAudioContext()

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized')
    }

    // AudioContextがsuspended状態の場合はresumeする
    if (this.audioContext.state === 'suspended') {
      console.log('[PNGTuber] AudioContext is suspended, resuming...')
      await this.audioContext.resume()
    }

    console.log('[PNGTuber] Playing audio, duration:', audioBuffer.duration)

    // 前の再生を停止
    this.stopAudio()

    this.onAudioFinishCallback = onFinish || null

    // GainNodeを作成（音量調整用）
    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = 1.0

    // AudioWorkletノードを作成
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      'volume-analyzer'
    )
    this.workletNode.port.onmessage = (event) => {
      this.handleAudioData(event.data)
    }

    // ソースノードを作成
    this.currentSource = this.audioContext.createBufferSource()
    this.currentSource.buffer = audioBuffer

    // 接続: source → worklet → gain → destination
    this.currentSource.connect(this.workletNode)
    this.workletNode.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // 再生終了時の処理
    this.currentSource.onended = () => {
      console.log('[PNGTuber] Audio playback ended')
      this.resetMouth()
      if (this.onAudioFinishCallback) {
        this.onAudioFinishCallback()
        this.onAudioFinishCallback = null
      }
    }

    // 再生開始
    this.currentSource.start()
    console.log('[PNGTuber] Audio started, context state:', this.audioContext.state)
  }

  /**
   * 音声を停止
   */
  stopAudio(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop()
        this.currentSource.disconnect()
      } catch {
        // ignore
      }
      this.currentSource = null
    }

    if (this.workletNode) {
      try {
        this.workletNode.port.onmessage = null
        this.workletNode.disconnect()
      } catch {
        // ignore
      }
      this.workletNode = null
    }

    this.volume = 0
    this.smoothedHighRatio = 0
    this.onAudioFinishCallback = null
  }

  /**
   * 音声データを処理
   */
  private handleAudioData(data: VolumeAnalyzerData): void {
    if (!data) return

    const smoothing = 0.2
    const ratio = data.high / (data.low + data.high + 1e-6)
    this.volume = this.volume * (1 - smoothing) + data.rms * smoothing
    this.smoothedHighRatio =
      this.smoothedHighRatio * (1 - smoothing) + ratio * smoothing

    const thresholds = this.getVolumeThresholds()
    const nextState = this.selectMouthState(
      this.volume,
      this.smoothedHighRatio,
      thresholds
    )
    this.setMouthState(nextState)
  }

  /**
   * 感度から閾値を計算
   */
  private getVolumeThresholds(): VolumeThresholds {
    const sensitivity = this.sensitivity / 100
    const closed = 0.008 + (1 - sensitivity) * 0.018
    const half = 0.02 + (1 - sensitivity) * 0.06
    return { closed, half }
  }

  /**
   * 口の状態を選択
   */
  private selectMouthState(
    volume: number,
    highRatio: number,
    thresholds: VolumeThresholds
  ): MouthState {
    if (volume < thresholds.closed) return 'closed'
    if (volume < thresholds.half)
      return this.mouthSpriteUrls.half ? 'half' : 'open'

    if (highRatio > 0.62 && this.mouthSpriteUrls.e) return 'e'
    if (highRatio < 0.38 && this.mouthSpriteUrls.u) return 'u'
    return 'open'
  }

  /**
   * 口の状態を設定
   */
  private setMouthState(state: MouthState, force = false): void {
    const sprite =
      this.mouthSprites[state] ||
      this.mouthSprites.open ||
      this.mouthSprites.closed
    if (!sprite) return

    const now = performance.now()
    if (!force && state !== this.mouthState && now - this.lastMouthChange < 70) {
      return
    }

    if (force || state !== this.mouthState) {
      this.mouthState = state
      this.activeSprite = sprite
      this.lastMouthChange = now
    }
  }

  /**
   * 口を閉じた状態にリセット
   */
  resetMouth(): void {
    this.volume = 0
    this.smoothedHighRatio = 0
    this.setMouthState('closed', true)
  }

  /**
   * 感度を設定
   */
  setSensitivity(value: number): void {
    this.sensitivity = Math.max(0, Math.min(100, value))
  }

  /**
   * レンダリングを開始
   */
  start(): void {
    if (!this.video || !this.trackData) {
      console.warn('Cannot start: video or trackData not loaded')
      return
    }

    this.isRunning = true

    // ResizeObserverをセットアップ
    if ('ResizeObserver' in window && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize())
      this.resizeObserver.observe(this.video)
    }

    // 動画を再生
    this.video.currentTime = 0
    this.video.play().catch((err) => {
      console.warn('Video play failed:', err)
    })

    // レンダリングループを開始
    this.startRenderLoop()
  }

  /**
   * レンダリングを停止
   */
  stop(): void {
    this.isRunning = false

    if (this.video) {
      this.video.pause()
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * レンダリングループを開始
   */
  private startRenderLoop(): void {
    if (!this.isRunning) return

    // requestVideoFrameCallbackがあれば使用（より正確な同期）
    if ('requestVideoFrameCallback' in this.video) {
      const onFrame = () => {
        if (!this.isRunning) return
        this.renderFrame()
        ;(this.video as HTMLVideoElement & {
          requestVideoFrameCallback: (callback: () => void) => void
        }).requestVideoFrameCallback(onFrame)
      }
      ;(this.video as HTMLVideoElement & {
        requestVideoFrameCallback: (callback: () => void) => void
      }).requestVideoFrameCallback(onFrame)
    } else {
      // フォールバック: requestAnimationFrame
      const loop = () => {
        if (!this.isRunning) return
        this.renderFrame()
        this.animationId = requestAnimationFrame(loop)
      }
      loop()
    }
  }

  /**
   * 1フレームをレンダリング
   */
  private renderFrame(): void {
    const video = this.video
    const data = this.trackData

    if (!video || video.readyState < 2 || !data) return

    const totalFrames = data.frames.length
    if (!totalFrames) return

    const currentTime = video.currentTime
    const fps = data.fps || 30
    const frameIndex = Math.floor(currentTime * fps) % totalFrames
    this.lastFrameIndex = frameIndex
    this.updateMouthTransform(frameIndex)
  }

  /**
   * リサイズ時の処理
   */
  private handleResize(): void {
    if (!this.trackData || !this.video || this.video.readyState < 2) return
    const totalFrames = this.trackData.frames.length
    if (!totalFrames) return

    const frameIndex =
      this.lastFrameIndex !== null
        ? this.lastFrameIndex
        : Math.floor(this.video.currentTime * (this.trackData.fps || 30)) %
          totalFrames
    this.updateMouthTransform(frameIndex)
  }

  /**
   * 口の変形を更新
   */
  private updateMouthTransform(frameIndex: number): void {
    const data = this.trackData
    if (!data || !data.frames || data.frames.length === 0) return
    if (!this.mouthCtx || !this.mouthCanvas) return

    const frame = data.frames[frameIndex]
    const ctx = this.mouthCtx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.mouthCanvas.width, this.mouthCanvas.height)
    if (!frame || !frame.valid) return

    const sprite =
      this.activeSprite ||
      this.mouthSprites.open ||
      this.mouthSprites.closed
    if (!sprite) return

    const quad = frame.quad
    const adjustedQuad = this.applyCalibrationToQuad(quad, data)
    this.drawWarpedSprite(sprite, adjustedQuad)
  }

  /**
   * キャリブレーションを適用
   */
  private applyCalibrationToQuad(
    quad: [[number, number], [number, number], [number, number], [number, number]],
    data: MouthTrackData
  ): [number, number][] {
    const calib = data.calibration || { offset: [0, 0], scale: 1, rotation: 0 }
    const applyCalib = data.calibrationApplied === true
    if (!applyCalib) {
      return quad.map((pt) => [pt[0], pt[1]] as [number, number])
    }

    const offsetX = calib.offset[0] || 0
    const offsetY = calib.offset[1] || 0
    const scale = calib.scale || 1
    const rotation = ((calib.rotation || 0) * Math.PI) / 180

    let cx = 0
    let cy = 0
    for (const [x, y] of quad) {
      cx += x
      cy += y
    }
    cx /= 4
    cy /= 4

    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    return quad.map(([x, y]) => {
      const dx = (x - cx) * scale
      const dy = (y - cy) * scale
      const rx = dx * cos - dy * sin + cx + offsetX
      const ry = dx * sin + dy * cos + cy + offsetY
      return [rx, ry] as [number, number]
    })
  }

  /**
   * スプライトをワープして描画
   */
  private drawWarpedSprite(
    sprite: HTMLImageElement,
    quad: [number, number][]
  ): void {
    if (!this.mouthCtx) return
    const sw = sprite.naturalWidth || sprite.width
    const sh = sprite.naturalHeight || sprite.height
    if (!sw || !sh) return

    // ソース座標
    const s0: [number, number] = [0, 0]
    const s1: [number, number] = [sw, 0]
    const s2: [number, number] = [sw, sh]
    const s3: [number, number] = [0, sh]

    // デスティネーション座標
    const q0 = quad[0]
    const q1 = quad[1]
    const q2 = quad[2]
    const q3 = quad[3]

    // 2つの三角形に分割して描画
    this.drawTriangle(sprite, s0, s1, s2, q0, q1, q2)
    this.drawTriangle(sprite, s0, s2, s3, q0, q2, q3)
  }

  /**
   * 三角形を描画
   */
  private drawTriangle(
    image: HTMLImageElement,
    s0: [number, number],
    s1: [number, number],
    s2: [number, number],
    d0: [number, number],
    d1: [number, number],
    d2: [number, number]
  ): void {
    if (!this.mouthCtx) return
    const ctx = this.mouthCtx
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.beginPath()
    ctx.moveTo(d0[0], d0[1])
    ctx.lineTo(d1[0], d1[1])
    ctx.lineTo(d2[0], d2[1])
    ctx.closePath()
    ctx.clip()

    const mat = this.computeAffine(s0, s1, s2, d0, d1, d2)
    if (!mat) {
      ctx.restore()
      return
    }
    ctx.setTransform(mat.a, mat.b, mat.c, mat.d, mat.e, mat.f)
    ctx.drawImage(image, 0, 0)
    ctx.restore()
  }

  /**
   * アフィン変換行列を計算
   */
  private computeAffine(
    s0: [number, number],
    s1: [number, number],
    s2: [number, number],
    d0: [number, number],
    d1: [number, number],
    d2: [number, number]
  ): AffineMatrix | null {
    const [sx0, sy0] = s0
    const [sx1, sy1] = s1
    const [sx2, sy2] = s2

    const [dx0, dy0] = d0
    const [dx1, dy1] = d1
    const [dx2, dy2] = d2

    const denom = sx0 * (sy1 - sy2) + sx1 * (sy2 - sy0) + sx2 * (sy0 - sy1)
    if (denom === 0) return null

    const a =
      (dx0 * (sy1 - sy2) + dx1 * (sy2 - sy0) + dx2 * (sy0 - sy1)) / denom
    const b =
      (dy0 * (sy1 - sy2) + dy1 * (sy2 - sy0) + dy2 * (sy0 - sy1)) / denom
    const c =
      (dx0 * (sx2 - sx1) + dx1 * (sx0 - sx2) + dx2 * (sx1 - sx0)) / denom
    const d =
      (dy0 * (sx2 - sx1) + dy1 * (sx0 - sx2) + dy2 * (sx1 - sx0)) / denom
    const e =
      (dx0 * (sx1 * sy2 - sx2 * sy1) +
        dx1 * (sx2 * sy0 - sx0 * sy2) +
        dx2 * (sx0 * sy1 - sx1 * sy0)) /
      denom
    const f =
      (dy0 * (sx1 * sy2 - sx2 * sy1) +
        dy1 * (sx2 * sy0 - sx0 * sy2) +
        dy2 * (sx0 * sy1 - sx1 * sy0)) /
      denom

    return { a, b, c, d, e, f }
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.stop()
    this.stopAudio()

    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    this.mouthSprites = {}
    this.mouthSpriteUrls = {}
    this.activeSprite = null
    this.trackData = null
  }
}
