import { Talk } from './messages'
import homeStore from '@/features/stores/home'

export class Live2DHandler {
  static async speak(audioBuffer: ArrayBuffer, talk: Talk) {
    const hs = homeStore.getState()
    const live2dViewer = hs.live2dViewer
    if (!live2dViewer) return

    const expression = 'SadLean'
    const audioUrl = createAudioUrl(audioBuffer)

    // Live2Dモデルの表情を設定
    if (expression) {
      live2dViewer.expression(expression)
    }

    // 音声再生の完了を待つ
    // live2dViewer.speakでは音声完了を検知できないので、Audioオブジェクトを使用して音声再生完了を検知する
    // Audioオブジェクトの方も再生すると二重に聞こえるので、mutedをtrueにして再生しないようにする
    // TODO: もっといい方法があればそれに変更する
    await new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl)
      audio.muted = true
      audio.onended = () => {
        resolve()
        URL.revokeObjectURL(audioUrl)
      }
      audio.play()
      live2dViewer.speak(audioUrl)
    })
  }
}

// 音声URLを作成・管理する関数
const createAudioUrl = (buffer: ArrayBuffer): string => {
  const audioBlob = new Blob([buffer], { type: 'audio/wav' })
  const audioUrl = URL.createObjectURL(audioBlob)

  return audioUrl
}
