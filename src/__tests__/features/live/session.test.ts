import { LiveSession } from '@/features/live/session'

class MockPeer {
  static last: MockPeer
  channel = {
    readyState: 'open',
    send: jest.fn(),
    close: jest.fn(),
    onmessage: null as null | ((event: { data: string }) => void),
    onclose: null as null | (() => void),
    onerror: null,
  }
  localDescription = { sdp: 'v=0\r\n' }
  iceGatheringState = 'complete'
  connectionState = 'connected'
  ontrack = null
  onconnectionstatechange = null
  addTrack = jest.fn()
  createOffer = jest.fn(async () => ({ type: 'offer', sdp: 'v=0' }))
  setLocalDescription = jest.fn(async () => {})
  setRemoteDescription = jest.fn(async () => {})
  close = jest.fn()
  createDataChannel = jest.fn(() => this.channel)
  constructor() {
    MockPeer.last = this
  }
  emit(type: string) {
    this.channel.onmessage?.({ data: JSON.stringify({ type }) })
  }
}
const savedPeer = global.RTCPeerConnection
const savedFetch = global.fetch
const savedMedia = navigator.mediaDevices
let track: { stop: jest.Mock; enabled: boolean }
let callbacks: {
  state: jest.Mock
  event: jest.Mock
  stream: jest.Mock
  cleanup: jest.Mock
}
beforeEach(() => {
  jest.useFakeTimers()
  track = { stop: jest.fn(), enabled: true }
  callbacks = {
    state: jest.fn(),
    event: jest.fn(),
    stream: jest.fn(),
    cleanup: jest.fn(),
  }
  global.RTCPeerConnection = MockPeer as unknown as typeof RTCPeerConnection
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: jest.fn(async () => ({
        getTracks: () => [track],
        getAudioTracks: () => [track],
      })),
    },
  })
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ transport: { sdp: 'v=0' } }),
  })) as unknown as typeof fetch
})
afterEach(() => {
  jest.useRealTimers()
  global.RTCPeerConnection = savedPeer
  global.fetch = savedFetch
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: savedMedia,
  })
})
test('waits for session.started, uses WebRTC, closes only after finalization', async () => {
  const session = new LiveSession(callbacks)
  await session.start({ voice: 'marin' })
  const peer = MockPeer.last
  expect(peer.channel.send).not.toHaveBeenCalled()
  expect(callbacks.state).not.toHaveBeenCalledWith('connected', undefined)
  peer.emit('session.started')
  expect(callbacks.state).toHaveBeenCalledWith('connected', undefined)
  session.close()
  expect(track.enabled).toBe(false)
  expect(peer.channel.send).toHaveBeenCalledWith(
    JSON.stringify({ type: 'session.close' })
  )
  expect(peer.close).not.toHaveBeenCalled()
  peer.emit('session.closed')
  expect(peer.close).toHaveBeenCalledTimes(1)
  expect(track.stop).toHaveBeenCalledTimes(1)
  expect(callbacks.cleanup).toHaveBeenCalledTimes(1)
})
test('stopping during permission prompt releases late microphone without creating a session', async () => {
  let resolve!: (stream: MediaStream) => void
  ;(navigator.mediaDevices.getUserMedia as jest.Mock).mockReturnValue(
    new Promise<MediaStream>((done) => {
      resolve = done
    })
  )
  const session = new LiveSession(callbacks)
  const pending = session.start({})
  session.close()
  resolve({ getTracks: () => [track] } as unknown as MediaStream)
  await pending
  expect(track.stop).toHaveBeenCalled()
  expect(global.fetch).not.toHaveBeenCalled()
})
test('missing final event times out and releases resources once', async () => {
  const session = new LiveSession(callbacks)
  await session.start({})
  MockPeer.last.emit('session.started')
  session.close()
  jest.advanceTimersByTime(15000)
  expect(callbacks.state).toHaveBeenCalledWith('error', 'Live.UnconfirmedClose')
  expect(callbacks.cleanup).toHaveBeenCalledTimes(1)
})
test('HTTP failure and startup timeout never leave the microphone running', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
  const session = new LiveSession(callbacks)
  await session.start({})
  expect(callbacks.state).toHaveBeenCalledWith('error', 'Live.SessionError')
  expect(track.stop).toHaveBeenCalled()
})

test('an open data channel is not sufficient to send commands before session.started', async () => {
  const session = new LiveSession(callbacks)
  await session.start({})
  session.close()
  expect(MockPeer.last.channel.send).not.toHaveBeenCalled()
  MockPeer.last.emit('session.started')
  expect(MockPeer.last.channel.send).toHaveBeenCalledWith(
    JSON.stringify({ type: 'session.close' })
  )
  MockPeer.last.emit('session.closed')
})

test('identifies server secret access denial and releases the microphone', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    json: async () => ({ errorCode: 'ServerSecretAccessDenied' }),
  })
  const session = new LiveSession(callbacks)
  await session.start({})
  expect(callbacks.state).toHaveBeenCalledWith(
    'error',
    'Live.ServerSecretAccessDenied'
  )
  expect(track.stop).toHaveBeenCalled()
  expect(MockPeer.last.setRemoteDescription).not.toHaveBeenCalled()
})

test.each([
  ['LiveHistoryLimitExceeded', 'Live.HistoryLimitExceeded'],
  ['LiveInstructionsLimitExceeded', 'Live.InstructionsLimitExceeded'],
  ['LiveTokenLimitExceeded', 'Live.TokenLimitExceeded'],
])('shows %s and releases the microphone', async (errorCode, message) => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    json: async () => ({ errorCode }),
  })
  const session = new LiveSession(callbacks)
  await session.start({})
  expect(callbacks.state).toHaveBeenCalledWith('error', message)
  expect(track.stop).toHaveBeenCalled()
})
