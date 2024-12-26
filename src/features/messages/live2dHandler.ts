import { Talk } from './messages'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'

export class Live2DHandler {
  private static idleMotionInterval: NodeJS.Timeout | null = null // インターバルIDを保持

  static async speak(audioBuffer: ArrayBuffer, talk: Talk) {
    const hs = homeStore.getState()
    const ss = settingsStore.getState()
    const live2dViewer = hs.live2dViewer
    if (!live2dViewer) return

    let expression: string | undefined
    let motion: string | undefined
    switch (talk.emotion) {
      case 'neutral':
        expression =
          ss.neutralEmotions[
            Math.floor(Math.random() * ss.neutralEmotions.length)
          ]
        motion = ss.neutralMotionGroup
        break
      case 'happy':
        expression =
          ss.happyEmotions[Math.floor(Math.random() * ss.happyEmotions.length)]
        motion = ss.happyMotionGroup
        break
      case 'sad':
        expression =
          ss.sadEmotions[Math.floor(Math.random() * ss.sadEmotions.length)]
        motion = ss.sadMotionGroup
        break
      case 'angry':
        expression =
          ss.angryEmotions[Math.floor(Math.random() * ss.angryEmotions.length)]
        motion = ss.angryMotionGroup
        break
      case 'relaxed':
        expression =
          ss.relaxedEmotions[
            Math.floor(Math.random() * ss.relaxedEmotions.length)
          ]
        motion = ss.relaxedMotionGroup
        break
    }
    const audioUrl = createAudioUrl(audioBuffer)

    // Live2Dモデルの表情を設定
    if (expression) {
      live2dViewer.expression(expression)
    }
    if (motion) {
      this.stopIdleMotion()
      live2dViewer.motion(motion, undefined, 3)
    }

    // 音声再生の完了を待つ
    // live2dViewer.speakでは音声完了を検知できないので、Audioオブジェクトを使用して音声再生完了を検知している
    // Audioオブジェクトの方も再生すると二重に聞こえてしまうので、再生音量を最低限に設定
    // TODO: もっといい方法があればそれに変更する
    await new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl)
      audio.volume = 0.01
      audio.onended = () => {
        resolve()
        URL.revokeObjectURL(audioUrl)
      }
      audio.play()
      live2dViewer.speak(audioUrl)
    })
  }

  static async resetToIdle() {
    // インターバルを停止
    this.stopIdleMotion()

    const hs = homeStore.getState()
    const ss = settingsStore.getState()
    const live2dViewer = hs.live2dViewer
    if (!live2dViewer) return

    const idleMotion = ss.idleMotionGroup || 'Idle'
    live2dViewer.motion(idleMotion)
    const expression =
      ss.neutralEmotions[Math.floor(Math.random() * ss.neutralEmotions.length)]
    if (expression) {
      live2dViewer.expression(expression)
    }

    // 5秒ごとのアイドルモーション再生を開始
    this.startIdleMotion(idleMotion, live2dViewer)
  }

  // アイドルモーションのインターバル開始
  private static startIdleMotion(idleMotion: string, live2dViewer: any) {
    this.idleMotionInterval = setInterval(() => {
      live2dViewer.motion(idleMotion)
    }, 5000)
  }

  // アイドルモーションのインターバル停止
  private static stopIdleMotion() {
    if (this.idleMotionInterval) {
      clearInterval(this.idleMotionInterval)
      this.idleMotionInterval = null
    }
  }
}

// 音声URLを作成・管理する関数
const createAudioUrl = (buffer: ArrayBuffer): string => {
  const audioBlob = new Blob([buffer], { type: 'audio/wav' })
  const audioUrl = URL.createObjectURL(audioBlob)

  return audioUrl
}
