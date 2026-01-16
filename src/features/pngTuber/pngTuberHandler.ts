/**
 * PNGTuberHandler - speakQueueとの連携用ハンドラー
 */

import { Talk } from '../messages/messages'
import homeStore from '@/features/stores/home'

export class PNGTuberHandler {
  /**
   * TTS音声を再生しながらリップシンク
   */
  static async speak(
    audioBuffer: ArrayBuffer,
    _talk: Talk,
    isNeedDecode: boolean = true
  ): Promise<void> {
    const hs = homeStore.getState()
    const pngTuberViewer = hs.pngTuberViewer
    if (!pngTuberViewer) return

    // PNGTuberエンジンで再生（エンジン内部のAudioContextでデコード）
    await new Promise<void>((resolve) => {
      let resolved = false

      const finish = () => {
        if (resolved) return
        resolved = true
        resolve()
      }

      pngTuberViewer
        .playAudioFromBuffer(audioBuffer, isNeedDecode, finish)
        .catch((e: Error) => {
          console.error('PNGTuber speak error:', e)
          finish()
        })

      // フォールバック: 30秒で強制解決
      setTimeout(finish, 30000)
    })
  }

  /**
   * 音声を停止
   */
  static stopSpeaking(): void {
    const hs = homeStore.getState()
    const pngTuberViewer = hs.pngTuberViewer
    if (!pngTuberViewer) return
    pngTuberViewer.stopAudio()
    // 口を閉じた状態にリセット
    pngTuberViewer.resetMouth()
  }

  /**
   * アイドル状態にリセット（口を閉じる）
   */
  static async resetToIdle(): Promise<void> {
    const hs = homeStore.getState()
    const pngTuberViewer = hs.pngTuberViewer
    if (!pngTuberViewer) return
    pngTuberViewer.resetMouth()
  }
}
