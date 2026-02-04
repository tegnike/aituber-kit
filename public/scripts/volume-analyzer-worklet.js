/**
 * PNGTuber用音量解析AudioWorklet
 * 700Hzを境界に低周波/高周波を分離し、RMSと各エネルギーを計算
 */
class VolumeAnalyzerProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    // 低周波フィルタの状態
    this.lowState = 0
    // 累積値
    this.rmsSum = 0
    this.lowEnergy = 0
    this.highEnergy = 0
    this.sampleCount = 0
    // 約60fpsでレポート
    this.reportSamples = Math.max(1, Math.floor(sampleRate / 60))
    // 700Hzのローパスフィルタ係数
    this.lowAlpha = 1 - Math.exp((-2 * Math.PI * 700) / sampleRate)
  }

  process(inputs, outputs) {
    const input = inputs[0]
    const output = outputs[0]

    if (!input || input.length === 0) return true

    const inputChannel = input[0]
    const outputChannel = output[0]

    for (let i = 0; i < inputChannel.length; i++) {
      const x = inputChannel[i]

      // 音声をパススルー（出力にコピー）
      if (outputChannel) {
        outputChannel[i] = x
      }

      // 1次IIRローパスフィルタ
      const low = this.lowState + this.lowAlpha * (x - this.lowState)
      this.lowState = low
      // 高周波成分 = 元信号 - 低周波成分
      const high = x - low

      // エネルギー累積
      this.rmsSum += x * x
      this.lowEnergy += low * low
      this.highEnergy += high * high
      this.sampleCount += 1

      // レポート間隔に達したらメインスレッドに送信
      if (this.sampleCount >= this.reportSamples) {
        const samples = this.sampleCount
        const rms = Math.sqrt(this.rmsSum / samples)
        const lowEnergy = this.lowEnergy / samples
        const highEnergy = this.highEnergy / samples
        this.port.postMessage({ rms, low: lowEnergy, high: highEnergy })

        // リセット
        this.sampleCount = 0
        this.rmsSum = 0
        this.lowEnergy = 0
        this.highEnergy = 0
      }
    }

    return true
  }
}

registerProcessor('volume-analyzer', VolumeAnalyzerProcessor)
