export type ActiveSpeech = { id: string; text: string } | null

/**
 * Reports speech state serially while collapsing queued transitions to the
 * latest value. A slow request must not replay already-finished captions.
 */
export const createActiveSpeechReporter = (
  report: (activeSpeech: ActiveSpeech) => Promise<void>
) => {
  let pending: ActiveSpeech | undefined
  let draining: Promise<void> | null = null

  const drain = async () => {
    while (pending !== undefined) {
      const activeSpeech = pending
      pending = undefined
      await report(activeSpeech)
    }
  }

  const startDrain = () => {
    if (!draining) {
      draining = drain().finally(() => {
        draining = null
        if (pending !== undefined) void startDrain()
      })
    }
    return draining
  }

  return {
    enqueue(activeSpeech: ActiveSpeech) {
      pending = activeSpeech
      return startDrain()
    },
  }
}
