import { logger } from '@/lib/logger'
import { LipSyncAnalyzeResult } from './lipSyncAnalyzeResult'

const TIME_DOMAIN_DATA_LENGTH = 2048

export class LipSync {
  public readonly audio: AudioContext
  public readonly analyser: AnalyserNode
  public readonly timeDomainData: Float32Array
  private userInteracted: boolean = false
  private waitingForInteraction: boolean = false
  private pendingPlaybacks: Array<{ start(): void; cancel(): void }> = []
  private forceStart: boolean = false
  private currentSource: AudioBufferSourceNode | null = null
  private currentStreamReader: ReadableStreamDefaultReader<Uint8Array> | null =
    null
  private currentStreamSources = new Set<AudioBufferSourceNode>()
  private streamPlaybackGeneration = 0

  public constructor(audio: AudioContext, options?: { forceStart?: boolean }) {
    this.audio = audio
    this.analyser = audio.createAnalyser()
    this.timeDomainData = new Float32Array(TIME_DOMAIN_DATA_LENGTH)
    this.forceStart = options?.forceStart || false

    // forceStartが有効な場合は強制的にインタラクション済みとマーク
    if (this.forceStart) {
      this.userInteracted = true
      this.tryResumeAudio().catch((error) => {
        logger.warn('Failed to force resume AudioContext:', error)
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
        logger.log('AudioContext resumed successfully')
        // 保留中の再生を処理
        this.processPendingPlaybacks()
      } catch (error) {
        logger.error('Failed to resume AudioContext:', error)
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
          logger.log('AudioContext resumed successfully')
        } catch (error) {
          logger.error('Failed to resume AudioContext:', error)
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
      logger.log(
        `Processing ${this.pendingPlaybacks.length} pending audio playbacks`
      )
      const playbacks = [...this.pendingPlaybacks]
      this.pendingPlaybacks = []
      playbacks.forEach((playback) => playback.start())
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
        logger.error('Failed to resume AudioContext:', error)
        return false
      }
    }

    this.waitingForInteraction = true
    logger.warn('AudioContext cannot start: waiting for user interaction')
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
    sampleRate: number = 24000,
    onStarted?: () => void
  ) {
    const queuedGeneration = this.streamPlaybackGeneration
    // AudioContextが準備できているか確認
    const isReady = await this.ensureAudioContextReady()
    if (queuedGeneration !== this.streamPlaybackGeneration) {
      onEnded?.()
      return
    }

    if (!isReady) {
      // ユーザーインタラクションを待つ
      this.pendingPlaybacks.push({
        start: () => {
          void this.playFromArrayBuffer(
            buffer,
            onEnded,
            isNeedDecode,
            sampleRate,
            onStarted
          )
        },
        cancel: () => onEnded?.(),
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
          logger.error('Failed to decode audio data:', decodeError)
          throw new Error('The audio data could not be decoded')
        }
      }

      if (queuedGeneration !== this.streamPlaybackGeneration) {
        onEnded?.()
        return
      }

      const bufferSource = this.audio.createBufferSource()
      // 再生中ソースを保持し、終了時にクリア
      this.currentSource = bufferSource
      bufferSource.buffer = audioBuffer

      bufferSource.connect(this.audio.destination)
      bufferSource.connect(this.analyser)
      bufferSource.onended = () => {
        if (this.currentSource === bufferSource) this.currentSource = null
        onEnded?.()
      }
      bufferSource.start()
      onStarted?.()
    } catch (error) {
      logger.error('Failed to play audio:', error)
      if (onEnded) {
        onEnded()
      }
      // ensure currentSource cleared on error
      if (queuedGeneration === this.streamPlaybackGeneration) {
        this.currentSource = null
      }
    }
  }

  /**
   * ヘッダーなしlittle-endian PCM16を読みながら100ms単位でWeb Audioへ予約する。
   * 全レスポンスを待たず最初のチャンクから発話を始め、同じAnalyserNodeで
   * 既存のVRMリップシンクを継続する。
   */
  public async playPcm16Stream(
    stream: ReadableStream<Uint8Array>,
    onEnded?: () => void,
    sampleRate: number = 16000,
    onStarted?: () => void
  ): Promise<void> {
    const queuedGeneration = this.streamPlaybackGeneration
    const isReady = await this.ensureAudioContextReady()
    const cancelStream = () =>
      stream.cancel('playback superseded').catch(() => {})
    if (queuedGeneration !== this.streamPlaybackGeneration) {
      await cancelStream()
      return
    }
    if (!isReady) {
      await new Promise<void>((resolve, reject) => {
        this.pendingPlaybacks.push({
          start: () => {
            void this.playPcm16Stream(
              stream,
              onEnded,
              sampleRate,
              onStarted
            ).then(resolve, reject)
          },
          cancel: () => {
            void cancelStream().then(resolve)
          },
        })
      })
      return
    }

    this.stopCurrentPlayback()
    const generation = this.streamPlaybackGeneration
    const reader = stream.getReader()
    this.currentStreamReader = reader

    // 100msはネットワークチャンクの細分化を抑えつつ、初動を遅らせすぎない。
    const bytesPerFrame = Math.max(2, Math.floor(sampleRate / 10) * 2)
    let pending = new Uint8Array(0)
    let nextStartAt = this.audio.currentTime + 0.03
    let lastSourceEnded: Promise<void> = Promise.resolve()
    const scheduledSources: Array<{
      duration: number
      ended: Promise<void>
    }> = []
    let scheduledDuration = 0
    let playbackStarted = false
    let completed = false

    // 100msフレームを最大約1.5秒分だけ予約し、全音声の先読みを避ける。
    const maxReadAheadSeconds = 1.5

    const waitForReadAheadCapacity = async () => {
      while (
        generation === this.streamPlaybackGeneration &&
        scheduledDuration >= maxReadAheadSeconds &&
        scheduledSources.length > 0
      ) {
        const nextSource = scheduledSources.shift()
        if (!nextSource) break
        await nextSource.ended
        scheduledDuration = Math.max(0, scheduledDuration - nextSource.duration)
      }
    }

    const finish = () => {
      if (completed) return
      completed = true
      onEnded?.()
    }

    const append = (left: Uint8Array, right: Uint8Array) => {
      const combined = new Uint8Array(left.byteLength + right.byteLength)
      combined.set(left)
      combined.set(right, left.byteLength)
      return combined
    }

    const schedule = (pcmBytes: Uint8Array) => {
      if (
        generation !== this.streamPlaybackGeneration ||
        pcmBytes.byteLength < 2
      ) {
        return
      }

      const sampleCount = Math.floor(pcmBytes.byteLength / 2)
      const floatData = new Float32Array(sampleCount)
      const view = new DataView(
        pcmBytes.buffer,
        pcmBytes.byteOffset,
        sampleCount * 2
      )
      for (let index = 0; index < sampleCount; index++) {
        const sample = view.getInt16(index * 2, true)
        floatData[index] = sample < 0 ? sample / 32768 : sample / 32767
      }

      const audioBuffer = this.audio.createBuffer(1, sampleCount, sampleRate)
      audioBuffer.getChannelData(0).set(floatData)
      const source = this.audio.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audio.destination)
      source.connect(this.analyser)
      this.currentStreamSources.add(source)

      const sourceEnded = new Promise<void>((resolve) => {
        source.onended = () => {
          this.currentStreamSources.delete(source)
          resolve()
        }
      })
      lastSourceEnded = sourceEnded
      scheduledSources.push({
        duration: audioBuffer.duration,
        ended: sourceEnded,
      })
      scheduledDuration += audioBuffer.duration

      const startAt = Math.max(nextStartAt, this.audio.currentTime + 0.01)
      source.start(startAt)
      nextStartAt = startAt + audioBuffer.duration
      if (!playbackStarted) {
        playbackStarted = true
        onStarted?.()
      }
    }

    try {
      while (generation === this.streamPlaybackGeneration) {
        await waitForReadAheadCapacity()
        if (generation !== this.streamPlaybackGeneration) break

        const { done, value } = await reader.read()
        if (done) break
        if (!value?.byteLength) continue

        pending = append(pending, value)
        while (pending.byteLength >= bytesPerFrame) {
          await waitForReadAheadCapacity()
          if (generation !== this.streamPlaybackGeneration) break
          schedule(pending.slice(0, bytesPerFrame))
          pending = pending.slice(bytesPerFrame)
        }
      }

      if (
        generation === this.streamPlaybackGeneration &&
        pending.byteLength >= 2
      ) {
        await waitForReadAheadCapacity()
        schedule(
          pending.slice(0, pending.byteLength - (pending.byteLength % 2))
        )
      }
      await lastSourceEnded
    } catch (error) {
      if (generation === this.streamPlaybackGeneration) {
        logger.error('Failed to play PCM16 stream:', error)
      }
    } finally {
      if (this.currentStreamReader === reader) {
        this.currentStreamReader = null
      }
      reader.releaseLock()
      finish()
    }
  }

  public async playFromURL(url: string, onEnded?: () => void) {
    try {
      const res = await fetch(url)
      const buffer = await res.arrayBuffer()
      await this.playFromArrayBuffer(buffer, onEnded)
    } catch (error) {
      logger.error('Failed to fetch audio from URL:', error)
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
    this.streamPlaybackGeneration++
    const pending = this.pendingPlaybacks
    this.pendingPlaybacks = []
    pending.forEach((playback) => playback.cancel())
    if (this.currentStreamReader) {
      void this.currentStreamReader.cancel().catch(() => {})
      this.currentStreamReader = null
    }
    for (const source of this.currentStreamSources) {
      try {
        source.stop()
      } catch (e) {
        logger.warn('LipSync stop stream source error:', e)
      }
    }
    this.currentStreamSources.clear()
    try {
      this.currentSource?.stop()
    } catch (e) {
      logger.warn('LipSync stopCurrentPlayback error:', e)
    }
    this.currentSource = null
  }
}
