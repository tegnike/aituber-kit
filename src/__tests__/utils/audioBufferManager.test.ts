import {
  AudioBufferManager,
  base64ToArrayBuffer,
  validateAudioBuffer,
} from '@/utils/audioBufferManager'

describe('AudioBufferManager', () => {
  let sendCallback: jest.Mock

  beforeEach(() => {
    sendCallback = jest.fn().mockResolvedValue(undefined)
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('mergeArrayBuffers', () => {
    it('should merge two buffers correctly', () => {
      const manager = new AudioBufferManager(sendCallback)
      const buf1 = new Uint8Array([1, 2, 3]).buffer
      const buf2 = new Uint8Array([4, 5, 6]).buffer

      const merged = manager.mergeArrayBuffers(buf1, buf2)

      expect(new Uint8Array(merged)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]))
    })

    it('should handle empty first buffer', () => {
      const manager = new AudioBufferManager(sendCallback)
      const buf1 = new ArrayBuffer(0)
      const buf2 = new Uint8Array([1, 2]).buffer

      const merged = manager.mergeArrayBuffers(buf1, buf2)
      expect(new Uint8Array(merged)).toEqual(new Uint8Array([1, 2]))
    })

    it('should handle empty second buffer', () => {
      const manager = new AudioBufferManager(sendCallback)
      const buf1 = new Uint8Array([1, 2]).buffer
      const buf2 = new ArrayBuffer(0)

      const merged = manager.mergeArrayBuffers(buf1, buf2)
      expect(new Uint8Array(merged)).toEqual(new Uint8Array([1, 2]))
    })
  })

  describe('addData', () => {
    it('should accumulate data without sending below threshold', () => {
      const manager = new AudioBufferManager(sendCallback, 1000)
      manager.addData(new Uint8Array(500).buffer)

      expect(sendCallback).not.toHaveBeenCalled()
    })

    it('should trigger sendBuffer when threshold is reached', () => {
      const manager = new AudioBufferManager(sendCallback, 100)
      manager.addData(new Uint8Array(150).buffer)

      expect(sendCallback).toHaveBeenCalledTimes(1)
    })

    it('should accumulate multiple chunks', () => {
      const manager = new AudioBufferManager(sendCallback, 1000)
      manager.addData(new Uint8Array(300).buffer)
      manager.addData(new Uint8Array(300).buffer)

      expect(sendCallback).not.toHaveBeenCalled()

      manager.addData(new Uint8Array(500).buffer)
      expect(sendCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('sendBuffer', () => {
    it('should send accumulated buffer and reset', async () => {
      const manager = new AudioBufferManager(sendCallback, 100000)
      manager.addData(new Uint8Array(50).buffer)

      await manager.sendBuffer()

      expect(sendCallback).toHaveBeenCalledTimes(1)
      const sentBuffer = sendCallback.mock.calls[0][0]
      expect(sentBuffer.byteLength).toBe(50)
    })

    it('should not send if buffer is empty', async () => {
      const manager = new AudioBufferManager(sendCallback)
      await manager.sendBuffer()

      expect(sendCallback).not.toHaveBeenCalled()
    })
  })

  describe('flush', () => {
    it('should send remaining buffer', async () => {
      const manager = new AudioBufferManager(sendCallback, 100000)
      manager.addData(new Uint8Array(50).buffer)

      await manager.flush()

      expect(sendCallback).toHaveBeenCalledTimes(1)
    })
  })
})

describe('validateAudioBuffer', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return false for buffer smaller than 1024 bytes', () => {
    expect(validateAudioBuffer(new ArrayBuffer(512))).toBe(false)
  })

  it('should return false for buffer larger than 1MB', () => {
    expect(validateAudioBuffer(new ArrayBuffer(1024 * 1024 + 2))).toBe(false)
  })

  it('should return false for odd-length buffer', () => {
    expect(validateAudioBuffer(new ArrayBuffer(1025))).toBe(false)
  })

  it('should return true for valid 16-bit PCM buffer', () => {
    const buffer = new ArrayBuffer(2048)
    const view = new Int16Array(buffer)
    view.fill(0)
    expect(validateAudioBuffer(buffer)).toBe(true)
  })

  it('should return true for buffer at lower size boundary (1024)', () => {
    const buffer = new ArrayBuffer(1024)
    const view = new Int16Array(buffer)
    view.fill(100)
    expect(validateAudioBuffer(buffer)).toBe(true)
  })

  it('should return true for buffer at upper size boundary (1MB)', () => {
    const buffer = new ArrayBuffer(1024 * 1024)
    const view = new Int16Array(buffer)
    view.fill(0)
    expect(validateAudioBuffer(buffer)).toBe(true)
  })
})

describe('base64ToArrayBuffer', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return empty buffer for invalid audio (too small)', () => {
    // A small base64 string that decodes to < 1024 bytes
    const smallBase64 = btoa('small')
    const result = base64ToArrayBuffer(smallBase64)
    expect(result.byteLength).toBe(0)
  })

  it('should decode valid base64 to ArrayBuffer when audio is valid', () => {
    // Create a valid 16-bit PCM buffer
    const buffer = new ArrayBuffer(2048)
    const view = new Int16Array(buffer)
    view.fill(100)

    // Convert to base64
    const uint8 = new Uint8Array(buffer)
    const binaryStr = Array.from(uint8)
      .map((b) => String.fromCharCode(b))
      .join('')
    const base64 = btoa(binaryStr)

    const result = base64ToArrayBuffer(base64)
    expect(result.byteLength).toBe(2048)
  })
})
