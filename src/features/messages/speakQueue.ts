import { Screenplay } from './messages'
import homeStore from '@/features/stores/home'

type SpeakTask = {
  audioBuffer: ArrayBuffer
  screenplay: Screenplay
  isNeedDecode: boolean
  onComplete?: () => void
}

export class SpeakQueue {
  private static readonly QUEUE_CHECK_DELAY = 1500
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
          console.error(
            'An error occurred while processing the speech synthesis task:',
            error
          )
          if (error instanceof Error) {
            console.error('Error details:', error.message)
          }
        }
      }
    }

    this.isProcessing = false
    this.scheduleNeutralExpression()
  }

  private async scheduleNeutralExpression() {
    const initialLength = this.queue.length
    await new Promise((resolve) =>
      setTimeout(resolve, SpeakQueue.QUEUE_CHECK_DELAY)
    )

    if (this.shouldResetToNeutral(initialLength)) {
      const hs = homeStore.getState()
      console.log('play neutral')
      await hs.viewer.model?.playEmotion('neutral')
    }
  }

  private shouldResetToNeutral(initialLength: number): boolean {
    return initialLength === 0 && this.queue.length === 0 && !this.isProcessing
  }

  clearQueue() {
    this.queue = []
  }
}
