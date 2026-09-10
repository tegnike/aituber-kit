import homeStore from '@/features/stores/home'

interface Live2DInternal {
  coreModel: {
    setParameterValueById?: (id: string, value: number) => void
    setParamFloat?: (id: string, value: number) => void
  }
  motionManager?: { lipSyncIds?: string[] }
  on: (event: string, listener: () => void) => void
  off: (event: string, listener: () => void) => void
}

// Analyse the actual WebRTC media track. Never queue copies of its audio.
export class LivePlayback {
  private context: AudioContext
  private analyser: AnalyserNode
  private source: MediaStreamAudioSourceNode | null = null
  private frame = 0
  private volume = 0
  private closed = false
  private vrm = homeStore.getState().viewer.model
  private png = homeStore.getState().pngTuberViewer
  private live2d = homeStore.getState().live2dViewer
  private get internal() {
    return this.live2d?.internalModel as unknown as Live2DInternal | undefined
  }
  private updateMouth = () => {
    const core = this.internal?.coreModel
    for (const id of this.internal?.motionManager?.lipSyncIds || [
      'ParamMouthOpenY',
    ]) {
      core?.setParameterValueById?.(id, this.volume)
    }
    core?.setParamFloat?.('PARAM_MOUTH_OPEN_Y', this.volume)
  }

  constructor(private audio: HTMLAudioElement) {
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 2048
    void this.context.resume().catch(() => {})
  }

  attach(stream: MediaStream) {
    if (this.closed) return Promise.resolve()
    this.source?.disconnect()
    this.source = this.context.createMediaStreamSource(stream)
    this.source.connect(this.analyser)
    this.audio.srcObject = stream
    const samples = new Float32Array(this.analyser.fftSize)
    cancelAnimationFrame(this.frame)
    this.internal?.off('beforeModelUpdate', this.updateMouth)
    this.internal?.on('beforeModelUpdate', this.updateMouth)
    const tick = () => {
      const home = homeStore.getState()
      if (this.vrm !== home.viewer.model) {
        if (this.vrm) this.vrm.externalLipSyncVolume = null
        this.vrm = home.viewer.model
      }
      if (this.png !== home.pngTuberViewer) {
        this.png?.setExternalAudioLevel(0)
        this.png = home.pngTuberViewer
      }
      if (this.live2d !== home.live2dViewer) {
        this.internal?.off('beforeModelUpdate', this.updateMouth)
        this.live2d = home.live2dViewer
        this.internal?.on('beforeModelUpdate', this.updateMouth)
      }
      this.analyser.getFloatTimeDomainData(samples)
      const rms = Math.sqrt(
        samples.reduce((sum, sample) => sum + sample * sample, 0) /
          samples.length
      )
      this.volume =
        this.audio.paused || this.audio.muted ? 0 : Math.min(1, rms * 8)
      if (this.vrm) this.vrm.externalLipSyncVolume = this.volume
      this.png?.setExternalAudioLevel(this.volume)
      const speaking = this.volume > 0.02
      if (homeStore.getState().isSpeaking !== speaking)
        homeStore.setState({ isSpeaking: speaking })
      this.frame = requestAnimationFrame(tick)
    }
    tick()
    return this.audio.play()
  }

  close() {
    if (this.closed) return
    this.closed = true
    cancelAnimationFrame(this.frame)
    this.source?.disconnect()
    this.analyser.disconnect()
    this.internal?.off('beforeModelUpdate', this.updateMouth)
    this.volume = 0
    this.updateMouth()
    if (this.vrm) this.vrm.externalLipSyncVolume = null
    this.png?.setExternalAudioLevel(0)
    this.audio.pause()
    this.audio.srcObject = null
    void this.context.close().catch(() => {})
    homeStore.setState({ isSpeaking: false, activeSpeech: null })
  }
}
