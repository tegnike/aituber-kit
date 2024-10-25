import { Screenplay } from './messages'
import homeStore from '@/features/stores/home'

type SpeakTask = {
  audioBuffer: ArrayBuffer
  screenplay: Screenplay
  isNeedDecode: boolean
  onComplete?: () => void
}

export class SpeakQueue {
  private queue: SpeakTask[] = []
  private isProcessing = false

  async addTask(task: SpeakTask) {
    this.queue.push(task)
    await this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true
    const hs = homeStore.getState()

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        try {
          const { audioBuffer, screenplay, isNeedDecode, onComplete } = task
          await hs.viewer.model?.speak(audioBuffer, screenplay, isNeedDecode)
          onComplete?.()
        } catch (error) {
          console.error('Error processing speak task:', error)
        }
      }
    }

    this.isProcessing = false

    // 一定時間待って、その間に新しいキューが追加されていないことを確認
    const checkQueueEmpty = async () => {
      const initialLength = this.queue.length
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // 待機時間後もキューが空のままであることを確認
      if (
        initialLength === 0 &&
        this.queue.length === 0 &&
        !this.isProcessing
      ) {
        await hs.viewer.model?.playEmotion('neutral')
      }
    }

    checkQueueEmpty()
  }

  clearQueue() {
    this.queue = []
  }
}
