export type ActiveSpeech = { id: string; text: string } | null

/**
 * Reports every transition immediately with a monotonically increasing
 * version. The server uses the version to discard late, out-of-order requests.
 */
export const createActiveSpeechReporter = (
  report: (activeSpeech: ActiveSpeech, version: number) => Promise<void>
) => {
  let lastVersion = Date.now() * 1000

  return {
    enqueue(activeSpeech: ActiveSpeech) {
      lastVersion = Math.max(lastVersion + 1, Date.now() * 1000)
      return report(activeSpeech, lastVersion)
    },
  }
}

export const createActiveSpeechStatusCoordinator = ({
  reportStatus,
  reportActiveSpeech,
  getActiveSpeech,
}: {
  reportStatus: () => Promise<boolean>
  reportActiveSpeech: (activeSpeech: ActiveSpeech) => Promise<void>
  getActiveSpeech: () => ActiveSpeech
}) => {
  let statusInitialized = false

  return {
    async reportClientStatus() {
      const reported = await reportStatus()
      if (reported && !statusInitialized) {
        statusInitialized = true
        await reportActiveSpeech(getActiveSpeech())
      }
    },
    reportSpeechTransition(activeSpeech: ActiveSpeech) {
      if (!statusInitialized) return Promise.resolve()
      return reportActiveSpeech(activeSpeech)
    },
  }
}
