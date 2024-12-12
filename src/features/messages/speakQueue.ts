import { Talk } from './messages'
import homeStore from '@/features/stores/home'

type SpeakTaskWithPromise = {
  audioBufferPromise: Promise<ArrayBuffer | null>
  talk: Talk
  isNeedDecode: boolean
  onComplete?: () => void
}

export class SpeakQueue {
  private static readonly QUEUE_CHECK_DELAY = 1500
  private queue: SpeakTaskWithPromise[] = []
  private isProcessing = false

  addTask(task: SpeakTaskWithPromise) {
    this.queue.push(task)
    this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true
    const hs = homeStore.getState()

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        try {
          const audioBuffer = await task.audioBufferPromise
          if (audioBuffer) {
            await hs.viewer.model?.speak(
              audioBuffer,
              task.talk,
              task.isNeedDecode
            )
            task.onComplete?.()
          }
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
