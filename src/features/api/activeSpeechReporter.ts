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
