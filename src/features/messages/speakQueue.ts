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

    checkQueueEmpty()
  }

  clearQueue() {
    this.queue = []
  }
}
