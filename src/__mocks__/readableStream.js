class MockReadableStream {
  constructor(options) {
    this._startFn = options.start
    this.locked = false
  }

  getReader() {
    this.locked = true
    return {
      read: async () => ({ done: true, value: undefined }),
      releaseLock: () => {
        this.locked = false
      },
    }
  }
}

global.ReadableStream = MockReadableStream
