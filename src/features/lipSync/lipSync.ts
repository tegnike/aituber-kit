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

  public async playFromArrayBuffer(buffer: ArrayBuffer, onEnded?: () => void) {
    try {
      // バッファの型チェック
      if (!(buffer instanceof ArrayBuffer)) {
        throw new Error('入力されたバッファがArrayBuffer形式ではありません')
      }

      // バッファの内容確認
      console.log('バッファサイズ:', buffer.byteLength)

      // デバッグ用のログ
      console.log('デコード開始')
      const audioBuffer = await this.audio.decodeAudioData(buffer)
      console.log('デコード成功')

      const bufferSource = this.audio.createBufferSource()
      bufferSource.buffer = audioBuffer

      bufferSource.connect(this.audio.destination)
      bufferSource.connect(this.analyser)
      bufferSource.start()
      if (onEnded) {
        bufferSource.addEventListener('ended', onEnded)
      }
    } catch (error) {
      console.error('オーディオデータのデコードに失敗しました:', error)
      // エラーハンドリングのロジックをここに追加
    }
  }

  public async playFromURL(url: string, onEnded?: () => void) {
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    this.playFromArrayBuffer(buffer, onEnded)
  }
}
