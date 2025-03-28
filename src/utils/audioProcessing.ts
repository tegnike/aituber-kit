// リサンプリング関数
export const resampleAudio = (
  audioData: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
): Float32Array => {
  const ratio = fromSampleRate / toSampleRate
  const newLength = Math.round(audioData.length / ratio)
  const result = new Float32Array(newLength)

  for (let i = 0; i < newLength; i++) {
    const position = i * ratio
    const leftIndex = Math.floor(position)
    const rightIndex = Math.ceil(position)
    const fraction = position - leftIndex

    if (rightIndex >= audioData.length) {
      result[i] = audioData[leftIndex]
    } else {
      result[i] =
        (1 - fraction) * audioData[leftIndex] + fraction * audioData[rightIndex]
    }
  }

  return result
}

// リサンプリングとモノラル変換を行う関数
export const processAudio = (audioBuffer: AudioBuffer): Float32Array => {
  const targetSampleRate = 24000
  const numChannels = audioBuffer.numberOfChannels

  // モノラルに変換
  let monoData = new Float32Array(audioBuffer.length)
  for (let i = 0; i < audioBuffer.length; i++) {
    let sum = 0
    for (let channel = 0; channel < numChannels; channel++) {
      sum += audioBuffer.getChannelData(channel)[i]
    }
    monoData[i] = sum / numChannels
  }

  // リサンプリング
  return resampleAudio(monoData, audioBuffer.sampleRate, targetSampleRate)
}

// Float32Array を PCM16 ArrayBuffer に変換する関数
export const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(float32Array.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

// Float32Array を base64エンコードされた PCM16 データに変換する関数
export const base64EncodeAudio = (float32Array: Float32Array): string => {
  const arrayBuffer = floatTo16BitPCM(float32Array)
  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)
  const chunkSize = 0x8000 // 32KB chunk size
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize))
    )
  }
  return btoa(binary)
}
