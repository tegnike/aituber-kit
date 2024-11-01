export type SendCallback = (buffer: ArrayBuffer) => Promise<void>

export class AudioBufferManager {
  private buffer: ArrayBuffer = new ArrayBuffer(0)
  private readonly BUFFER_THRESHOLD: number
  private readonly sendCallback: SendCallback

  constructor(sendCallback: SendCallback, bufferThreshold: number = 100_000) {
    this.sendCallback = sendCallback
    this.BUFFER_THRESHOLD = bufferThreshold
  }

  mergeArrayBuffers(buffer1: ArrayBuffer, buffer2: ArrayBuffer): ArrayBuffer {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
    tmp.set(new Uint8Array(buffer1), 0)
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
    return tmp.buffer
  }

  addData(newData: ArrayBuffer): void {
    console.log('Adding data to buffer:', newData.byteLength)
    this.buffer = this.mergeArrayBuffers(this.buffer, newData)
    if (this.buffer.byteLength >= this.BUFFER_THRESHOLD) {
      this.sendBuffer()
    }
  }

  async sendBuffer(): Promise<void> {
    if (this.buffer.byteLength > 0) {
      const bufferToSend = this.buffer
      this.buffer = new ArrayBuffer(0)
      await this.sendCallback(bufferToSend)
    }
  }

  async flush(): Promise<void> {
    await this.sendBuffer()
  }
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const arrayBuffer = bytes.buffer
  if (!validateAudioBuffer(arrayBuffer)) {
    console.error('Invalid audio buffer')
    return new ArrayBuffer(0)
  }

  return arrayBuffer
}

export function validateAudioBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 1024 || buffer.byteLength > 1024 * 1024) {
    console.error(`Invalid buffer size: ${buffer.byteLength} bytes`)
    return false
  }

  if (buffer.byteLength % 2 !== 0) {
    console.error('Buffer size is not even, which is required for 16-bit PCM')
    return false
  }

  const int16Array = new Int16Array(buffer)
  const isInValidRange = int16Array.every(
    (value) => value >= -32768 && value <= 32767
  )
  if (!isInValidRange) {
    console.error(
      'Audio data contains values outside the valid range for 16-bit PCM'
    )
    return false
  }

  return true
}
