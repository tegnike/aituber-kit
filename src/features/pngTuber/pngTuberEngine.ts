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
  private mainCanvas: HTMLCanvasElement
  private mainCtx: CanvasRenderingContext2D | null
  private mouthCanvas: HTMLCanvasElement
  private mouthCtx: CanvasRenderingContext2D | null

  // クロマキー関連
  private chromaKeyEnabled = false
  private chromaKeyColor = '#00FF00'
  private chromaKeyTolerance = 50
  private chromaKeyRGB: [number, number, number] = [0, 255, 0]

  // データ
  private trackData: MouthTrackData | null = null
  private mouthSprites: Partial<MouthSprites> = {}
  private mouthSpriteUrls: Partial<MouthSpriteUrls> = {}
  private activeSprite: HTMLImageElement | null = null

  // 音声関連
  private audioContext: AudioContext | null = null
  private audioWorkletReady: Promise<void> | null = null
  private workletNode: AudioWorkletNode | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private volume = 0
  private smoothedHighRatio = 0
  private sensitivity = 50

  // HQ Audio関連（エンベロープフォロワー・ノイズゲート）
  private hqAudioEnabled = true // TTS用にデフォルトでON
  private envelope = 0
  private noiseFloor = 0.002
  private levelPeak = 0.02
  private mouthChangeMinMs = 45 // HQモードのデフォルト

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
    mainCanvas: HTMLCanvasElement,
    mouthCanvas: HTMLCanvasElement
  ) {
    this.video = video
    this.mainCanvas = mainCanvas
    this.mainCtx = mainCanvas.getContext('2d')
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
      const videoWidth = this.video.videoWidth || 1
      const videoHeight = this.video.videoHeight || 1

      this.mainCanvas.width = videoWidth
      this.mainCanvas.height = videoHeight
      if (this.mainCtx) {
        this.mainCtx.setTransform(1, 0, 0, 1, 0, 0)
        this.mainCtx.imageSmoothingEnabled = true
        this.mainCtx.clearRect(0, 0, videoWidth, videoHeight)
      }

      this.mouthCanvas.width = videoWidth
      this.mouthCanvas.height = videoHeight
      if (this.mouthCtx) {
        this.mouthCtx.setTransform(1, 0, 0, 1, 0, 0)
        this.mouthCtx.imageSmoothingEnabled = true
        this.mouthCtx.clearRect(0, 0, videoWidth, videoHeight)
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
    if (this.audioWorkletReady) {
      await this.audioWorkletReady
      return
    }

    this.audioContext = new AudioContext()

    // AudioWorkletを登録
    if (this.audioContext.audioWorklet) {
      this.audioWorkletReady = this.audioContext.audioWorklet.addModule(
        '/scripts/volume-analyzer-worklet.js'
      )
      await this.audioWorkletReady
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
    console.log(
      '[PNGTuber] Audio started, context state:',
      this.audioContext.state
    )
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

    this.resetAudioStats()
    this.onAudioFinishCallback = null
  }

  /**
   * 音声解析の統計をリセット
   */
  private resetAudioStats(): void {
    this.volume = 0
    this.envelope = 0
    this.noiseFloor = 0.002
    this.levelPeak = 0.02
    this.smoothedHighRatio = 0
  }

  /**
   * 音声データを処理
   */
  private handleAudioData(data: VolumeAnalyzerData): void {
    if (!data) return

    // HQモードが有効な場合は専用処理
    if (this.hqAudioEnabled) {
      this.handleAudioDataHQ(data)
      return
    }

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
   * HQ Audio用の音声データ処理
   * エンベロープフォロワー・ノイズゲート・ダイナミックレンジ調整
   */
  private handleAudioDataHQ(data: VolumeAnalyzerData): void {
    // 高周波比率の平滑化
    const ratio = data.high / (data.low + data.high + 1e-6)
    const ratioSmoothing = 0.25
    this.smoothedHighRatio =
      this.smoothedHighRatio * (1 - ratioSmoothing) + ratio * ratioSmoothing

    // エンベロープフォロワー（アタック/リリース）
    const rms = data.rms
    const sensitivity = this.sensitivity / 100
    const attack = 0.35
    const release = 0.6
    const k = rms > this.envelope ? attack : release
    this.envelope = this.envelope * (1 - k) + rms * k

    // ノイズフロアの動的推定
    if (this.envelope < this.noiseFloor) {
      const fall = 0.25
      this.noiseFloor = this.noiseFloor * (1 - fall) + this.envelope * fall
    } else {
      const rise = 0.01
      this.noiseFloor = this.noiseFloor * (1 - rise) + this.envelope * rise
    }

    // ピークレベルのトラッキング
    const peakDecay = 0.985
    this.levelPeak = Math.max(this.envelope, this.levelPeak * peakDecay)
    const minRange = 0.006
    if (this.levelPeak < this.noiseFloor + minRange) {
      this.levelPeak = this.noiseFloor + minRange
    }

    // ノイズゲート
    const gateMargin = 0.002 + (1 - sensitivity) * 0.008
    const gateLevel = this.noiseFloor + gateMargin
    if (this.envelope < gateLevel) {
      this.volume = 0
      this.setMouthState('closed')
      return
    }

    // レベルの正規化と成形
    const rawLevel =
      (this.envelope - this.noiseFloor) / (this.levelPeak - this.noiseFloor)
    const level = Math.max(0, Math.min(1, rawLevel))
    const gain = 0.6 + sensitivity * 0.8
    const shaped = Math.min(1, Math.pow(level, 0.75) * gain)

    this.volume = shaped

    // 口状態の選択（HQ用ヒステリシス付き）
    const thresholds = this.getVolumeThresholdsHQ()
    const nextState = this.selectMouthStateHQ(
      shaped,
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
   * HQ Audio用の閾値を計算
   */
  private getVolumeThresholdsHQ(): VolumeThresholds {
    const sensitivity = this.sensitivity / 100
    const closed = 0.07 + (1 - sensitivity) * 0.08
    const half = 0.22 + (1 - sensitivity) * 0.12
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
   * HQ Audio用の口状態選択（ヒステリシス付き）
   * 口の開閉に異なる閾値を使用してチャタリングを防止
   */
  private selectMouthStateHQ(
    level: number,
    highRatio: number,
    thresholds: VolumeThresholds
  ): MouthState {
    const hasHalf = !!this.mouthSpriteUrls.half
    const hasE = !!this.mouthSpriteUrls.e
    const hasU = !!this.mouthSpriteUrls.u

    // ヒステリシス用の閾値
    const closeTh = Math.max(0.02, thresholds.closed - 0.03)
    const halfDownTh = Math.max(closeTh + 0.02, thresholds.half - 0.02)

    // 現在の状態をベースに判定
    let state: MouthState = this.mouthState
    if (state === 'e' || state === 'u') {
      state = 'open'
    }

    // 状態遷移の判定
    if (state === 'closed') {
      if (level >= thresholds.half) {
        state = 'open'
      } else if (level >= thresholds.closed && hasHalf) {
        state = 'half'
      } else if (level >= thresholds.closed) {
        state = 'open'
      } else {
        state = 'closed'
      }
    } else if (state === 'half') {
      if (level < closeTh) {
        state = 'closed'
      } else if (level >= thresholds.half) {
        state = 'open'
      } else {
        state = 'half'
      }
    } else {
      // state === 'open'
      if (level < closeTh) {
        state = 'closed'
      } else if (level < halfDownTh && hasHalf) {
        state = 'half'
      } else {
        state = 'open'
      }
    }

    // 開いた状態の場合、周波数で母音を判定
    if (state === 'open') {
      if (highRatio > 0.62 && hasE) return 'e'
      if (highRatio < 0.38 && hasU) return 'u'
    }
    return state
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
    if (
      !force &&
      state !== this.mouthState &&
      now - this.lastMouthChange < this.mouthChangeMinMs
    ) {
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
    this.resetAudioStats()
    this.setMouthState('closed', true)
  }

  /**
   * 感度を設定
   */
  setSensitivity(value: number): void {
    this.sensitivity = Math.max(0, Math.min(100, value))
  }

  /**
   * クロマキー設定を更新
   */
  setChromaKeySettings(
    enabled: boolean,
    color: string,
    tolerance: number
  ): void {
    this.chromaKeyEnabled = enabled
    this.chromaKeyColor = color
    this.chromaKeyTolerance = Math.max(0, Math.min(255, tolerance))
    this.chromaKeyRGB = this.hexToRGB(color)
  }

  /**
   * 16進数カラーコードをRGBに変換
   */
  private hexToRGB(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    }
    return [0, 255, 0] // デフォルトはグリーン
  }

  /**
   * レンダリングを開始
   */
  start(): void {
    if (!this.video || !this.trackData) {
      console.warn('Cannot start: video or trackData not loaded')
      return
    }

    // 既に実行中の場合は先に停止する（重複ループを防止）
    if (this.isRunning) {
      this.stop()
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
        ;(
          this.video as HTMLVideoElement & {
            requestVideoFrameCallback: (callback: () => void) => void
          }
        ).requestVideoFrameCallback(onFrame)
      }
      ;(
        this.video as HTMLVideoElement & {
          requestVideoFrameCallback: (callback: () => void) => void
        }
      ).requestVideoFrameCallback(onFrame)
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

    if (this.chromaKeyEnabled) {
      this.renderWithChromaKey(frameIndex)
    } else {
      this.updateMouthTransform(frameIndex)
    }
  }

  /**
   * クロマキー有効時のレンダリング
   */
  private renderWithChromaKey(frameIndex: number): void {
    const video = this.video
    const data = this.trackData
    if (!data || !this.mainCtx || !this.mainCanvas) return

    const ctx = this.mainCtx
    const width = this.mainCanvas.width
    const height = this.mainCanvas.height

    // キャンバスをクリア（透明で）
    ctx.clearRect(0, 0, width, height)

    // 動画をキャンバスに描画
    ctx.drawImage(video, 0, 0, width, height)

    // クロマキー処理を適用
    this.applyChromaKey(ctx, width, height)

    // 口スプライトを描画
    this.drawMouthSpriteOnMain(frameIndex)
  }

  /**
   * クロマキー処理を適用
   */
  private applyChromaKey(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    const [keyR, keyG, keyB] = this.chromaKeyRGB
    const tolerance = this.chromaKeyTolerance

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      // ユークリッド距離で色の差を計算
      const distance = Math.sqrt(
        (r - keyR) ** 2 + (g - keyG) ** 2 + (b - keyB) ** 2
      )

      if (distance < tolerance) {
        // 透明にする
        data[i + 3] = 0
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * mainCanvasに口スプライトを描画
   */
  private drawMouthSpriteOnMain(frameIndex: number): void {
    const data = this.trackData
    if (!data || !data.frames || data.frames.length === 0) return
    if (!this.mainCtx || !this.mainCanvas) return

    const frame = data.frames[frameIndex]
    if (!frame || !frame.valid) return

    const sprite =
      this.activeSprite || this.mouthSprites.open || this.mouthSprites.closed
    if (!sprite) return

    const quad = frame.quad
    const adjustedQuad = this.applyCalibrationToQuad(quad, data)
    this.drawWarpedSpriteOnCtx(this.mainCtx, sprite, adjustedQuad)
  }

  /**
   * 指定したContextにワープしたスプライトを描画
   */
  private drawWarpedSpriteOnCtx(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLImageElement,
    quad: [number, number][]
  ): void {
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
    this.drawTriangleOnCtx(ctx, sprite, s0, s1, s2, q0, q1, q2)
    this.drawTriangleOnCtx(ctx, sprite, s0, s2, s3, q0, q2, q3)
  }

  /**
   * 指定したContextに三角形を描画
   */
  private drawTriangleOnCtx(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    s0: [number, number],
    s1: [number, number],
    s2: [number, number],
    d0: [number, number],
    d1: [number, number],
    d2: [number, number]
  ): void {
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
      this.activeSprite || this.mouthSprites.open || this.mouthSprites.closed
    if (!sprite) return

    const quad = frame.quad
    const adjustedQuad = this.applyCalibrationToQuad(quad, data)
    this.drawWarpedSprite(sprite, adjustedQuad)
  }

  /**
   * キャリブレーションを適用
   */
  private applyCalibrationToQuad(
    quad: [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ],
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
      this.audioWorkletReady = null
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
