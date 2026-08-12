import {
  createActiveSpeechReporter,
  createActiveSpeechStatusCoordinator,
} from '@/features/api/activeSpeechReporter'

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

describe('createActiveSpeechStatusCoordinator', () => {
  it('waits for client status initialization before reporting the latest speech', async () => {
    const activeSpeech = { id: 'speech-1', text: '最初の発話です。' }
    const reportStatus = jest
      .fn<Promise<boolean>, []>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
    const reportActiveSpeech = jest.fn().mockResolvedValue(undefined)
    const getActiveSpeech = jest.fn(() => activeSpeech)
    const coordinator = createActiveSpeechStatusCoordinator({
      reportStatus,
      reportActiveSpeech,
      getActiveSpeech,
    })

    await coordinator.reportSpeechTransition(activeSpeech)
    await coordinator.reportClientStatus()

    expect(reportActiveSpeech).not.toHaveBeenCalled()

    await coordinator.reportClientStatus()

    expect(reportActiveSpeech).toHaveBeenCalledTimes(1)
    expect(reportActiveSpeech).toHaveBeenCalledWith(activeSpeech)
    expect(getActiveSpeech).toHaveBeenCalledTimes(1)
  })

  it('reports later speech transitions immediately after initialization', async () => {
    const initialSpeech = { id: 'speech-1', text: '最初の発話です。' }
    const nextSpeech = { id: 'speech-2', text: '次の発話です。' }
    const reportActiveSpeech = jest.fn().mockResolvedValue(undefined)
    const coordinator = createActiveSpeechStatusCoordinator({
      reportStatus: jest.fn().mockResolvedValue(true),
      reportActiveSpeech,
      getActiveSpeech: () => initialSpeech,
    })

    await coordinator.reportClientStatus()
    await coordinator.reportSpeechTransition(nextSpeech)

    expect(reportActiveSpeech.mock.calls.map(([speech]) => speech)).toEqual([
      initialSpeech,
      nextSpeech,
    ])
  })
})
