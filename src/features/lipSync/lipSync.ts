import { LipSyncAnalyzeResult } from './lipSyncAnalyzeResult'

const TIME_DOMAIN_DATA_LENGTH = 1024  // 2048から1024に変更（より頻繁な更新）

export class LipSync {
  public readonly audio: AudioContext
  public readonly analyser: AnalyserNode
  public readonly gainNode: GainNode
  public readonly timeDomainData: Float32Array
  private userInteracted: boolean = false
  private waitingForInteraction: boolean = false
  private pendingPlaybacks: Array<() => void> = []
  private forceStart: boolean = false
  private currentSource: AudioBufferSourceNode | null = null
  private connectedAudioElement: HTMLAudioElement | null = null
  private audioElementSource: MediaElementAudioSourceNode | null = null
  private initializationRetries: number = 0
  private maxRetries: number = 3

  public constructor(audio: AudioContext, options?: { forceStart?: boolean }) {
    console.log('🔊 LipSync初期化開始', {
      audioContextState: audio.state,
      sampleRate: audio.sampleRate,
      forceStart: options?.forceStart,
    })

    this.audio = audio
    this.forceStart = options?.forceStart || false

    try {
      // GainNodeを作成（音量調整とルーティング用）
      this.gainNode = audio.createGain()
      this.gainNode.gain.value = 1.0  // 音量は100%
      
      // AnalyserNodeを作成
      this.analyser = audio.createAnalyser()
      this.analyser.fftSize = TIME_DOMAIN_DATA_LENGTH
      // より敏感に音声を検出するための設定
      this.analyser.smoothingTimeConstant = 0.3  // スムージングを減らして反応性を向上
      this.analyser.minDecibels = -90  // より小さな音も検出
      this.analyser.maxDecibels = -10  // より広い範囲の音を検出
      
      // オーディオグラフの接続: GainNode → AnalyserNode → destination
      // これにより、すべての音声がAnalyserNodeを通る
      this.gainNode.connect(this.analyser)
      this.analyser.connect(this.audio.destination)
      
      this.timeDomainData = new Float32Array(TIME_DOMAIN_DATA_LENGTH)

      console.log('✅ オーディオグラフ作成成功', {
        fftSize: this.analyser.fftSize,
        frequencyBinCount: this.analyser.frequencyBinCount,
        smoothingTimeConstant: this.analyser.smoothingTimeConstant,
        minDecibels: this.analyser.minDecibels,
        maxDecibels: this.analyser.maxDecibels,
        gainValue: this.gainNode.gain.value,
        audioGraph: 'source → gainNode → analyser → destination'
      })
    } catch (error) {
      console.error('❌ オーディオグラフ作成失敗:', error)
      throw new Error(`LipSync初期化失敗: ${error}`)
    }

    // AudioContextの初期化
    this.initializeAudioContext()
  }

  private async initializeAudioContext() {
    console.log(
      `🔊 AudioContext初期化 (試行 ${this.initializationRetries + 1}/${this.maxRetries})`
    )

    try {
      // forceStartが有効な場合は強制的にインタラクション済みとマーク
      if (this.forceStart) {
        this.userInteracted = true
        await this.tryResumeAudio()
        console.log('✅ forceStart有効 - AudioContext強制再開')
      } else {
        // 通常のユーザーインタラクション検出を設定
        this.setupUserInteractionDetection()
        console.log('👆 ユーザーインタラクション検出を設定')
      }

      // 成功した場合はリトライカウンターをリセット
      this.initializationRetries = 0
    } catch (error) {
      console.error(
        `❌ AudioContext初期化失敗 (試行 ${this.initializationRetries + 1}):`,
        error
      )

      this.initializationRetries++
      if (this.initializationRetries < this.maxRetries) {
        console.log(`🔄 ${2000 * this.initializationRetries}ms後に再試行`)
        setTimeout(() => {
          this.initializeAudioContext()
        }, 2000 * this.initializationRetries) // 指数的バックオフ
      } else {
        console.error('❌ AudioContext初期化の最大試行回数に達しました')
      }
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

    // AudioContextとAnalyserNodeの状態確認
    if (!this.analyser || !this.timeDomainData) {
      console.warn('⚠️ AnalyserNodeまたはtimeDomainDataが未初期化')
      return { volume: 0 }
    }

    // 再生中の音源があるかチェック（AudioBufferSourceまたはHTMLAudioElement）
    const hasAudioBufferSource = !!this.currentSource
    const hasConnectedAudio = !!(this.connectedAudioElement && 
                                !this.connectedAudioElement.paused && 
                                !this.connectedAudioElement.ended)
    const hasSource = hasAudioBufferSource || hasConnectedAudio

    // 時間領域データを取得
    this.analyser.getFloatTimeDomainData(this.timeDomainData)

    // データの最初の10個をサンプリングして確認
    let hasData = false
    for (let i = 0; i < Math.min(10, TIME_DOMAIN_DATA_LENGTH); i++) {
      if (this.timeDomainData[i] !== 0) {
        hasData = true
        break
      }
    }

    // RMS（二乗平均平方根）を使用してより正確な音量を計算
    let sum = 0.0
    for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
      sum += this.timeDomainData[i] * this.timeDomainData[i]
    }
    let rms = Math.sqrt(sum / TIME_DOMAIN_DATA_LENGTH)
    
    // ピーク値も併用
    let peak = 0.0
    for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
      peak = Math.max(peak, Math.abs(this.timeDomainData[i]))
    }
    
    // RMSとピークの組み合わせで最終的な音量を決定
    let volume = Math.max(rms * 2, peak * 0.8)

    // より緩やかなカーブで変換（感度向上）
    volume = 1 / (1 + Math.exp(-20 * volume + 3))
    
    // 最小閾値を下げて小さな音でも反応するように
    if (volume < 0.05) volume = 0
    
    // 最大値でクリップ
    volume = Math.min(volume, 1.0)

    // デバッグログ（音量検出時のみ表示）
    if (volume > 0.01) {
      // 実際に音量が検出された時のみログ出力
      console.log(`🎤 音量解析: Volume=${volume.toFixed(3)}, hasSource=${hasSource}, hasData=${hasData}`)
    }
    
    // MediaElementAudioSourceNode接続時のみアラート表示（新しいチャンク送信方式では正常）
    if (hasSource && !hasData && this.connectedAudioElement) {
      // HTMLAudioElement接続でデータが流れない場合のみ警告
      console.warn('⚠️ HTMLAudioElement音声ソース再生中ですが、AnalyserNodeにデータが流れていません')
    }

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
    console.log('🎵 音声再生開始', {
      bufferSize: buffer.byteLength,
      isNeedDecode,
      sampleRate,
      audioContextState: this.audio.state,
    })

    // AudioContextが準備できているか確認
    const isReady = await this.ensureAudioContextReady()

    if (!isReady) {
      console.warn(
        '⚠️ AudioContextが準備できていません。ペンディングキューに追加'
      )
      // ユーザーインタラクションを待つ
      this.pendingPlaybacks.push(() => {
        this.playFromArrayBuffer(buffer, onEnded, isNeedDecode, sampleRate)
      })
      return
    }

    try {
      // バッファの詳細検証
      if (!(buffer instanceof ArrayBuffer)) {
        throw new Error('The input buffer is not in ArrayBuffer format')
      }

      if (buffer.byteLength === 0) {
        throw new Error('The input buffer is empty')
      }

      console.log('✅ バッファ検証成功。音声データ処理開始')

      let audioBuffer: AudioBuffer

      if (!isNeedDecode) {
        // PCM16形式の場合
        console.log('🔢 PCM16形式として処理')
        const pcmData = new Int16Array(buffer)

        const floatData = new Float32Array(pcmData.length)
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] =
            pcmData[i] < 0 ? pcmData[i] / 32768.0 : pcmData[i] / 32767.0
        }

        audioBuffer = this.audio.createBuffer(1, floatData.length, sampleRate)
        audioBuffer.getChannelData(0).set(floatData)

        // 音声データの内容をサンプリング検証
        const channelData = audioBuffer.getChannelData(0)
        let nonZeroSamples = 0
        let maxAmplitude = 0
        let sampleSum = 0
        
        for (let i = 0; i < Math.min(1000, channelData.length); i++) {
          const sample = Math.abs(channelData[i])
          if (sample > 0.001) nonZeroSamples++
          maxAmplitude = Math.max(maxAmplitude, sample)
          sampleSum += sample
        }
        
        const avgAmplitude = sampleSum / Math.min(1000, channelData.length)

        console.log('✅ PCM16バッファ作成成功', {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          totalSamples: channelData.length,
          nonZeroSamples,
          maxAmplitude: maxAmplitude.toFixed(4),
          avgAmplitude: avgAmplitude.toFixed(4),
          hasAudioData: nonZeroSamples > 0 && maxAmplitude > 0.001
        })
      } else {
        // 通常の圧縮音声ファイルの場合
        console.log('🎵 圧縮音声として処理')
        try {
          audioBuffer = await this.audio.decodeAudioData(buffer.slice()) // buffer のコピーを作成
          
          // 音声データの内容をサンプリング検証
          const channelData = audioBuffer.getChannelData(0)
          let nonZeroSamples = 0
          let maxAmplitude = 0
          let sampleSum = 0
          
          for (let i = 0; i < Math.min(1000, channelData.length); i++) {
            const sample = Math.abs(channelData[i])
            if (sample > 0.001) nonZeroSamples++
            maxAmplitude = Math.max(maxAmplitude, sample)
            sampleSum += sample
          }
          
          const avgAmplitude = sampleSum / Math.min(1000, channelData.length)

          console.log('✅ 音声デコード成功', {
            duration: audioBuffer.duration,
            numberOfChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
            totalSamples: channelData.length,
            nonZeroSamples,
            maxAmplitude: maxAmplitude.toFixed(4),
            avgAmplitude: avgAmplitude.toFixed(4),
            hasAudioData: nonZeroSamples > 0 && maxAmplitude > 0.001
          })
        } catch (decodeError) {
          console.error('❌ 音声デコード失敗:', decodeError)
          throw new Error(`音声データのデコードに失敗: ${decodeError}`)
        }
      }

      // AudioBufferSourceNodeの作成と設定
      const bufferSource = this.audio.createBufferSource()
      this.currentSource = bufferSource
      bufferSource.buffer = audioBuffer

      // 音声の接続設定: bufferSource → gainNode → analyser → destination
      // GainNodeが中継することで、音声が確実にAnalyserNodeを通る
      bufferSource.connect(this.gainNode)

      console.log('🔗 オーディオ接続完了', {
        bufferDuration: audioBuffer.duration,
        bufferLength: audioBuffer.length,
        bufferSampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        analyserConnected: !!this.analyser,
        audioContextState: this.audio.state,
        currentTime: this.audio.currentTime
      })

      // 再生開始
      bufferSource.start()

      // 終了イベントの設定
      bufferSource.onended = () => {
        console.log('🏁 音声再生完了')
        if (this.currentSource === bufferSource) {
          this.currentSource = null
        }
        onEnded?.()
      }
    } catch (error) {
      console.error('❌ 音声再生エラー:', error)

      // エラー詳細の分析
      if (error instanceof DOMException) {
        console.error('DOM例外詳細:', {
          name: error.name,
          message: error.message,
          code: error.code,
        })
      }

      // クリーンアップとコールバック実行
      this.currentSource = null
      if (onEnded) {
        onEnded()
      }
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
   * HTMLAudioElementをLipSync分析に接続
   * ストリーミング音声などでLipSyncを動作させるために使用
   */
  public connectAudioElement(audioElement: HTMLAudioElement): void {
    console.log('🔗 HTMLAudioElementをLipSyncに接続開始')
    
    try {
      // 既存の接続をクリーンアップ
      this.disconnectAudioElement()
      
      // MediaElementAudioSourceNodeを作成
      this.audioElementSource = this.audio.createMediaElementSource(audioElement)
      this.connectedAudioElement = audioElement
      
      // オーディオグラフに接続: audioElement → mediaElementSource → gainNode → analyser → destination
      this.audioElementSource.connect(this.gainNode)
      
      console.log('✅ HTMLAudioElementをLipSyncに接続完了')
      
      // 再生開始/終了の監視
      const handlePlay = () => {
        console.log('▶️ HTMLAudioElement再生開始')
      }
      
      const handleEnded = () => {
        console.log('🏁 HTMLAudioElement再生終了')
      }
      
      audioElement.addEventListener('play', handlePlay)
      audioElement.addEventListener('ended', handleEnded)
      audioElement.addEventListener('pause', handleEnded)
      
    } catch (error) {
      console.error('❌ HTMLAudioElement接続エラー:', error)
      this.disconnectAudioElement()
      throw error // エラーを再スローして上位で処理
    }
  }

  /**
   * HTMLAudioElementの接続を解除
   */
  public disconnectAudioElement(): void {
    if (this.audioElementSource) {
      try {
        this.audioElementSource.disconnect()
        this.audioElementSource = null
        console.log('✅ HTMLAudioElement接続解除完了')
      } catch (error) {
        console.warn('⚠️ HTMLAudioElement接続解除エラー:', error)
      }
    }
    this.connectedAudioElement = null
  }

  /**
   * 現在再生中の音声を停止
   */
  public stopCurrentPlayback() {
    console.log('🛑 音声再生停止要求')
    try {
      if (this.currentSource) {
        this.currentSource.stop()
        console.log('✅ AudioBufferSource音声再生停止完了')
      }
      
      if (this.connectedAudioElement) {
        this.connectedAudioElement.pause()
        console.log('✅ HTMLAudioElement音声再生停止完了')
      }
      
      if (!this.currentSource && !this.connectedAudioElement) {
        console.log('ℹ️ 停止する音声はありません')
      }
    } catch (e) {
      console.warn('⚠️ LipSync stopCurrentPlayback error:', e)
    }
    this.currentSource = null
  }

  /**
   * 診断情報を取得
   */
  public getStatus() {
    // 現在の音量も計算
    let currentVolume = 0
    if (this.analyser && this.timeDomainData) {
      this.analyser.getFloatTimeDomainData(this.timeDomainData)
      for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
        currentVolume = Math.max(currentVolume, Math.abs(this.timeDomainData[i]))
      }
    }

    return {
      audioContextState: this.audio.state,
      sampleRate: this.audio.sampleRate,
      currentTime: this.audio.currentTime,
      userInteracted: this.userInteracted,
      waitingForInteraction: this.waitingForInteraction,
      pendingPlaybacksCount: this.pendingPlaybacks.length,
      forceStart: this.forceStart,
      hasCurrentSource: !!this.currentSource,
      initializationRetries: this.initializationRetries,
      maxRetries: this.maxRetries,
      analyserConnected: !!this.analyser,
      analyserFftSize: this.analyser?.fftSize,
      analyserSmoothingTimeConstant: this.analyser?.smoothingTimeConstant,
      analyserMinDecibels: this.analyser?.minDecibels,
      analyserMaxDecibels: this.analyser?.maxDecibels,
      timeDomainDataLength: this.timeDomainData?.length,
      currentRawVolume: currentVolume,
    }
  }

  /**
   * コンソールに詳細な診断情報を出力
   */
  public logDetailedStatus() {
    const status = this.getStatus()
    console.log('🔍 LipSync詳細状態:', status)

    // 問題の可能性がある場合の警告
    if (status.audioContextState !== 'running') {
      console.warn(
        '⚠️ AudioContextが実行中ではありません:',
        status.audioContextState
      )
    }

    if (!status.userInteracted && !status.forceStart) {
      console.warn('⚠️ ユーザーインタラクションが検出されていません')
    }

    if (status.pendingPlaybacksCount > 0) {
      console.warn(
        `⚠️ ${status.pendingPlaybacksCount}個の再生がペンディング中です`
      )
    }

    if (status.initializationRetries > 0) {
      console.warn(
        `⚠️ ${status.initializationRetries}回の初期化リトライが発生しました`
      )
    }
  }
}
