import { createActiveSpeechReporter } from '@/features/api/activeSpeechReporter'

describe('createActiveSpeechReporter', () => {
  it('reports every transition immediately with increasing versions', async () => {
    let releaseFirstReport: (() => void) | undefined
    const firstReport = new Promise<void>((resolve) => {
      releaseFirstReport = resolve
    })
    const report = jest
      .fn()
      .mockImplementationOnce(() => firstReport)
      .mockResolvedValue(undefined)
    const reporter = createActiveSpeechReporter(report)
    const firstSpeech = { id: 'speech-1', text: '最初の発話です。' }
    const secondSpeech = { id: 'speech-2', text: '次の発話です。' }

    const first = reporter.enqueue(firstSpeech)
    await reporter.enqueue(null)
    await reporter.enqueue(secondSpeech)
    releaseFirstReport?.()
    await first

    expect(report).toHaveBeenCalledTimes(3)
    expect(report.mock.calls.map(([speech]) => speech)).toEqual([
      firstSpeech,
      null,
      secondSpeech,
    ])
    const versions = report.mock.calls.map(([, version]) => version)
    expect(versions[0]).toBeLessThan(versions[1])
    expect(versions[1]).toBeLessThan(versions[2])
  })
})
