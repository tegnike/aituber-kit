import { createActiveSpeechReporter } from '@/features/api/activeSpeechReporter'

describe('createActiveSpeechReporter', () => {
  it('collapses transitions queued behind a slow report to the latest state', async () => {
    let releaseFirstReport: (() => void) | undefined
    const firstReport = new Promise<void>((resolve) => {
      releaseFirstReport = resolve
    })
    const report = jest
      .fn()
      .mockImplementationOnce(() => firstReport)
      .mockResolvedValue(undefined)
    const reporter = createActiveSpeechReporter(report)
    const latestSpeech = { id: 'speech-2', text: '現在の発話です。' }

    const idle = reporter.enqueue(null)
    void reporter.enqueue({ id: 'speech-1', text: '終了済みの発話です。' })
    void reporter.enqueue(null)
    void reporter.enqueue(latestSpeech)
    releaseFirstReport?.()
    await idle

    expect(report).toHaveBeenCalledTimes(2)
    expect(report).toHaveBeenNthCalledWith(1, null)
    expect(report).toHaveBeenNthCalledWith(2, latestSpeech)
  })
})
