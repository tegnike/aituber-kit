import { Talk } from './messages'
import homeStore from '@/features/stores/home'

export class Live2DHandler {
  static async speak(audioBuffer: ArrayBuffer, talk: Talk) {
    const hs = homeStore.getState()
    const live2dViewer = hs.live2dViewer
    if (!live2dViewer) return

    const expression = 'SadLean'
    const audioUrl = createAudioUrl(audioBuffer)

    // 音声の再生とエクスプレッションの設定
    live2dViewer.speak(audioUrl)
    live2dViewer.expression(expression)
  }
}

// 音声URLを作成・管理する関数
const createAudioUrl = (buffer: ArrayBuffer): string => {
  const audioBlob = new Blob([buffer], { type: 'audio/wav' })
  const audioUrl = URL.createObjectURL(audioBlob)

  // 一定時間後にURLを解放
  setTimeout(() => {
    URL.revokeObjectURL(audioUrl)
  }, 1000)

  return audioUrl
}
