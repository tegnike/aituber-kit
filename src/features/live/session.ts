export type LiveState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'closing'
  | 'closed'
  | 'error'
export interface LiveEvent {
  type: string
  event_id?: string
  delta?: string
  start_ms?: number
  end_ms?: number
  usage?: { seconds?: number }
  event?: { type?: string; response?: { status?: string } }
}

// One instance owns one connection. A late microphone/fetch result cannot revive it.
export class LiveSession {
  private peer: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private microphone: MediaStream | null = null
  private controller = new AbortController()
  private startupTimer?: ReturnType<typeof setTimeout>
  private closeTimer?: ReturnType<typeof setTimeout>
  private disconnectTimer?: ReturnType<typeof setTimeout>
  private cancelled = false
  private released = false
  private state: LiveState = 'idle'

  constructor(
    private callbacks: {
      state: (state: LiveState, error?: string) => void
      event: (event: LiveEvent) => void
      stream: (stream: MediaStream) => void
      cleanup: () => void
    }
  ) {}

  private update(state: LiveState, error?: string) {
    this.state = state
    this.callbacks.state(state, error)
  }

  private release() {
    if (this.released) return
    this.released = true
    this.cancelled = true
    clearTimeout(this.startupTimer)
    clearTimeout(this.closeTimer)
    clearTimeout(this.disconnectTimer)
    this.controller.abort()
    this.microphone?.getTracks().forEach((track) => track.stop())
    this.channel?.close()
    this.peer?.close()
    this.callbacks.cleanup()
  }

  private fail(error = 'Live.ConnectionError') {
    if (this.released) return
    this.update('error', error)
    this.release()
  }

  async start(configuration: Record<string, unknown>) {
    if (this.state !== 'idle') return
    this.update('connecting')
    this.startupTimer = setTimeout(() => this.fail(), 45000)
    try {
      const peer = new RTCPeerConnection()
      this.peer = peer
      peer.ontrack = ({ track }) => {
        if (!this.cancelled) this.callbacks.stream(new MediaStream([track]))
      }
      peer.onconnectionstatechange = () => {
        clearTimeout(this.disconnectTimer)
        if (!this.released && peer.connectionState === 'disconnected') {
          this.disconnectTimer = setTimeout(() => this.fail(), 10000)
        }
        if (
          !this.released &&
          ['failed', 'closed'].includes(peer.connectionState)
        )
          this.fail()
      }
      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      if (this.cancelled) {
        microphone.getTracks().forEach((track) => track.stop())
        return
      }
      this.microphone = microphone
      microphone
        .getAudioTracks()
        .forEach((track) => peer.addTrack(track, microphone))
      const channel = peer.createDataChannel('oai-events')
      this.channel = channel
      channel.onmessage = ({ data }) => {
        if (this.released) return
        try {
          const event = JSON.parse(data) as LiveEvent
          if (event.type === 'session.closed') {
            this.callbacks.event(event)
            this.update('closed')
            this.release()
            return
          }
          if (event.type === 'session.started') {
            clearTimeout(this.startupTimer)
            if (this.cancelled) {
              channel.send(JSON.stringify({ type: 'session.close' }))
            } else this.update('connected')
          }
          if (event.type === 'error') {
            this.callbacks.state(this.state, 'Live.ServerError')
          }
          this.callbacks.event(event)
        } catch {
          this.fail('Live.ServerError')
        }
      }
      channel.onclose = () => {
        if (!this.released) this.fail('Live.UnconfirmedClose')
      }
      channel.onerror = () => this.fail()
      await peer.setLocalDescription(await peer.createOffer())
      if (this.cancelled) return
      await this.waitForIce(peer)
      if (this.cancelled) return
      const response = await fetch('/api/ai/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...configuration,
          sdp: peer.localDescription?.sdp,
        }),
        signal: this.controller.signal,
      })
      if (this.cancelled) return
      if (!response.ok) {
        let errorCode: unknown
        try {
          errorCode = (await response.json())?.errorCode
        } catch {
          // Non-JSON errors still need to release the microphone.
        }
        const errors: Record<string, string> = {
          ServerSecretAccessDenied: 'Live.ServerSecretAccessDenied',
          LiveHistoryLimitExceeded: 'Live.HistoryLimitExceeded',
          LiveInstructionsLimitExceeded: 'Live.InstructionsLimitExceeded',
          LiveTokenLimitExceeded: 'Live.TokenLimitExceeded',
        }
        this.fail(
          typeof errorCode === 'string'
            ? errors[errorCode] || 'Live.SessionError'
            : 'Live.SessionError'
        )
        return
      }
      const result = await response.json()
      if (this.cancelled) return
      await peer.setRemoteDescription({
        type: 'answer',
        sdp: result.transport.sdp,
      })
    } catch (error) {
      if (!this.cancelled)
        this.fail(
          error instanceof Error && error.message === 'Live.SessionError'
            ? error.message
            : 'Live.ConnectionError'
        )
    }
  }

  private waitForIce(peer: RTCPeerConnection): Promise<void> {
    if (peer.iceGatheringState === 'complete') return Promise.resolve()
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer)
        peer.removeEventListener('icegatheringstatechange', check)
        this.controller.signal.removeEventListener('abort', abort)
      }
      const check = () => {
        if (peer.iceGatheringState !== 'complete') return
        cleanup()
        resolve()
      }
      const abort = () => {
        cleanup()
        reject(new Error('Cancelled'))
      }
      const timer = setTimeout(() => {
        cleanup()
        reject(new Error('ICE timeout'))
      }, 10000)
      peer.addEventListener('icegatheringstatechange', check)
      this.controller.signal.addEventListener('abort', abort, { once: true })
      check()
    })
  }

  close() {
    if (this.released || this.state === 'closing') return
    const started = this.state === 'connected'
    this.cancelled = true
    // Stop transmitting immediately, but keep the event channel for final usage.
    this.microphone?.getAudioTracks().forEach((track) => {
      track.enabled = false
    })
    if (this.channel?.readyState === 'open') {
      this.update('closing')
      this.closeTimer = setTimeout(
        () => this.fail('Live.UnconfirmedClose'),
        15000
      )
      try {
        if (started)
          this.channel.send(JSON.stringify({ type: 'session.close' }))
      } catch {
        this.fail('Live.UnconfirmedClose')
      }
    } else {
      this.update('closed')
      this.release()
    }
  }
}
