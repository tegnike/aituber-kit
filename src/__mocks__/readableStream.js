class MockReadableStream {
  constructor(options) {
    this._startFn = options.start
  }
}

global.ReadableStream = MockReadableStream
