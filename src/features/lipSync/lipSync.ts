import { LipSyncAnalyzeResult } from './lipSyncAnalyzeResult'

const TIME_DOMAIN_DATA_LENGTH = 2048

export class LipSync {
  public readonly audio: AudioContext
  public readonly analyser: AnalyserNode
  public readonly timeDomainData: Float32Array

  public constructor(audio: AudioContext) {
    this.audio = audio

    this.analyser = audio.createAnalyser()
    this.timeDomainData = new Float32Array(TIME_DOMAIN_DATA_LENGTH)
  }

  public update(): LipSyncAnalyzeResult {
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
    isPCM16: boolean = true
  ) {
    try {
      // バッファの型チェック
      if (!(buffer instanceof ArrayBuffer)) {
        throw new Error('入力されたバッファがArrayBuffer形式ではありません')
      }

      console.log('バッファサイズ:', buffer.byteLength)

      // バッファの長さチェック
      if (buffer.byteLength === 0) {
        throw new Error('バッファが空です')
      }

      let audioBuffer: AudioBuffer

      if (isPCM16) {
        // PCM16形式の場合
        const pcmData = new Int16Array(buffer)
        console.log('PCMデータ長:', pcmData.length)

        if (pcmData.length === 0) {
          throw new Error('PCMデータが空です')
        }

        const floatData = new Float32Array(pcmData.length)
        for (let i = 0; i < pcmData.length; i++) {
          floatData[i] = pcmData[i] / 32768.0
        }
        // WebSocketから受け取ったデータのサンプリングレートを使用（例: 24000Hz）
        const sampleRate = 24000
        audioBuffer = this.audio.createBuffer(1, floatData.length, sampleRate)
        audioBuffer.getChannelData(0).set(floatData)
      } else {
        // 通常の圧縮音声ファイルの場合
        console.log('デコード開始')
        audioBuffer = await this.audio.decodeAudioData(buffer)
        console.log('デコード成功')
      }

      console.log('オーディオバッファ長:', audioBuffer.length)

      const bufferSource = this.audio.createBufferSource()
      bufferSource.buffer = audioBuffer

      bufferSource.connect(this.audio.destination)
      bufferSource.connect(this.analyser)
      bufferSource.start()
      if (onEnded) {
        bufferSource.addEventListener('ended', onEnded)
      }
    } catch (error) {
      console.error('オーディオデータの処理に失敗しました:', error)
      // エラーハンドリングのロジックをここに追加
      if (onEnded) {
        onEnded() // エラー時にもonEndedコールバックを呼び出す
      }
    }
  }

  public async playFromURL(url: string, onEnded?: () => void) {
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    this.playFromArrayBuffer(buffer, onEnded)
  }
}
