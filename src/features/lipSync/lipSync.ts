import { LipSyncAnalyzeResult } from './lipSyncAnalyzeResult'

const TIME_DOMAIN_DATA_LENGTH = 2048

export class LipSync {
  public readonly audio: AudioContext
  public readonly analyser: AnalyserNode
  public readonly timeDomainData: Float32Array
  private userInteracted: boolean = false
  private waitingForInteraction: boolean = false
  private pendingPlaybacks: Array<() => void> = []
  private forceStart: boolean = false
  private currentSource: AudioBufferSourceNode | null = null

  public constructor(audio: AudioContext, options?: { forceStart?: boolean }) {
    this.audio = audio
    this.analyser = audio.createAnalyser()
    this.timeDomainData = new Float32Array(TIME_DOMAIN_DATA_LENGTH)
    this.forceStart = options?.forceStart || false

    // forceStartが有効な場合は強制的にインタラクション済みとマーク
    if (this.forceStart) {
      this.userInteracted = true
      this.tryResumeAudio().catch((error) => {
        console.warn('Failed to force resume AudioContext:', error)
      })
    } else {
      // 通常のユーザーインタラクション検出を設定
      this.setupUserInteractionDetection()
    }
  }

  // AudioContextの再開を試みるメソッド
  private async tryResumeAudio(): Promise<void> {
    if (this.audio.state === 'suspended') {
      try {
        await this.audio.resume()
        console.log('AudioContext resumed successfully')
        // 保留中の再生を処理
        this.processPendingPlaybacks()
      } catch (error) {
        console.error('Failed to resume AudioContext:', error)
      }
    }
  }

  private setupUserInteractionDetection(): void {
    // すでにアクティブなコンテキストの場合は設定をスキップ
    if (this.audio.state === 'running') {
      this.userInteracted = true
      return
    }

    // ユーザーインタラクションをリッスン
    const interactionEvents = ['click', 'touchstart', 'keydown', 'mousedown']
    const handleInteraction = async () => {
      this.userInteracted = true

      if (this.audio.state === 'suspended') {
        try {
          await this.audio.resume()
          console.log('AudioContext resumed successfully')
        } catch (error) {
          console.error('Failed to resume AudioContext:', error)
        }
      }

      // 保留中の再生を処理
      this.processPendingPlaybacks()

      // 一度だけ実行したいので、イベントリスナーを削除
      interactionEvents.forEach((eventType) => {
        window.removeEventListener(eventType, handleInteraction, true)
      })
    }

    // イベントリスナーを追加
    interactionEvents.forEach((eventType) => {
      window.addEventListener(eventType, handleInteraction, true)
    })
  }

  private processPendingPlaybacks(): void {
    if (this.pendingPlaybacks.length > 0) {
      console.log(
        `Processing ${this.pendingPlaybacks.length} pending audio playbacks`
      )
      const playbacks = [...this.pendingPlaybacks]
      this.pendingPlaybacks = []
      playbacks.forEach((playback) => playback())
    }
  }

  private async ensureAudioContextReady(): Promise<boolean> {
    // forceStartが有効な場合は常に準備完了とみなす
    if (this.forceStart) {
      await this.tryResumeAudio()
      return true
    }

    if (this.audio.state === 'running') {
      return true
    }

    if (this.userInteracted) {
      try {
        await this.audio.resume()
        return true
      } catch (error) {
        console.error('Failed to resume AudioContext:', error)
        return false
      }
    }

    this.waitingForInteraction = true
    console.warn('AudioContext cannot start: waiting for user interaction')
    return false
  }

  // forceStart設定を動的に変更するメソッドを追加
  public setForceStart(enable: boolean): void {
    this.forceStart = enable
    if (enable && !this.userInteracted) {
      this.userInteracted = true
      this.tryResumeAudio()
    }
  }

  public update(): LipSyncAnalyzeResult {
    // forceStartが有効でAudioContextが準備できていない場合は再開を試みる
    if (this.forceStart && this.audio.state === 'suspended') {
      this.tryResumeAudio()
    }

    this.analyser.getFloatTimeDomainData(this.timeDomainData)

    let volume = 0.0
    for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
      volume = Math.max(volume, Math.abs(this.timeDomainData[i]))
    }

    // cook
    volume = 1 / (1 + Math.exp(-45 * volume + 5))
    if (volume < 0.1) volume = 0

    return {
      volume,
    }
  }

  public async playFromArrayBuffer(
    buffer: ArrayBuffer,
    onEnded?: () => void,
    isNeedDecode: boolean = true,
    sampleRate: number = 24000
  ) {
    // AudioContextが準備できているか確認
    const isReady = await this.ensureAudioContextReady()

    if (!isReady) {
      // ユーザーインタラクションを待つ
      this.pendingPlaybacks.push(() => {
        this.playFromArrayBuffer(buffer, onEnded, isNeedDecode, sampleRate)
      })
      return
    }

    try {
      // バッファの型チェック
      if (!(buffer instanceof ArrayBuffer)) {
        throw new Error('The input buffer is not in ArrayBuffer format')
      }

      // バッファの長さチェック
      if (buffer.byteLength === 0) {
        throw new Error('The input buffer is empty')
      }

      let audioBuffer: AudioBuffer

      if (!isNeedDecode) {
        // PCM16形式の場合
        const pcmData = new Int16Array(buffer)

        const floatData = new Float32Array(pcmData.length)
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] =
            pcmData[i] < 0 ? pcmData[i] / 32768.0 : pcmData[i] / 32767.0
        }

        audioBuffer = this.audio.createBuffer(1, floatData.length, sampleRate)
        audioBuffer.getChannelData(0).set(floatData)
      } else {
        // 通常の圧縮音声ファイルの場合
        try {
          audioBuffer = await this.audio.decodeAudioData(buffer)
        } catch (decodeError) {
          console.error('Failed to decode audio data:', decodeError)
          throw new Error('The audio data could not be decoded')
        }
      }

      const bufferSource = this.audio.createBufferSource()
      // 再生中ソースを保持し、終了時にクリア
      this.currentSource = bufferSource
      bufferSource.buffer = audioBuffer

      bufferSource.connect(this.audio.destination)
      bufferSource.connect(this.analyser)
      bufferSource.start()
      if (onEnded) {
        bufferSource.addEventListener('ended', onEnded)
      }

      // 再生終了後にクリア
      bufferSource.onended = () => {
        if (this.currentSource === bufferSource) this.currentSource = null
        onEnded?.()
      }
    } catch (error) {
      console.error('Failed to play audio:', error)
      if (onEnded) {
        onEnded()
      }
      // ensure currentSource cleared on error
      this.currentSource = null
    }
  }

  public async playFromURL(url: string, onEnded?: () => void) {
    try {
      const res = await fetch(url)
      const buffer = await res.arrayBuffer()
      await this.playFromArrayBuffer(buffer, onEnded)
    } catch (error) {
      console.error('Failed to fetch audio from URL:', error)
      if (onEnded) {
        onEnded()
      }
    }
  }

  // PCM16形式かどうかを判断するメソッド
  private detectPCM16(buffer: ArrayBuffer): boolean {
    // バッファサイズが偶数であることを確認
    if (buffer.byteLength % 2 !== 0) {
      return false
    }

    // サンプルデータの範囲をチェック
    const int16Array = new Int16Array(buffer)
    let isWithinRange = true
    for (let i = 0; i < Math.min(1000, int16Array.length); i++) {
      if (int16Array[i] < -32768 || int16Array[i] > 32767) {
        isWithinRange = false
        break
      }
    }

    // データの分布を簡単にチェック
    let nonZeroCount = 0
    for (let i = 0; i < Math.min(1000, int16Array.length); i++) {
      if (int16Array[i] !== 0) {
        nonZeroCount++
      }
    }

    // 少なくともデータの10%が非ゼロであることを確認
    const hasReasonableDistribution =
      nonZeroCount > Math.min(1000, int16Array.length) * 0.1

    return isWithinRange && hasReasonableDistribution
  }

  /**
   * 現在再生中の音声を停止
   */
  public stopCurrentPlayback() {
    try {
      this.currentSource?.stop()
    } catch (e) {
      console.warn('LipSync stopCurrentPlayback error:', e)
    }
    this.currentSource = null
  }
}
