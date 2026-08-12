import { createAssignmentReconciliationRunner } from '@/features/presentation/assignmentReconciliation'
import type { PresentationAssignment } from '@/features/presentation/presentationTypes'

const assignment = (
  autoStart: boolean,
  presentationId = 'presentation-1'
): PresentationAssignment => ({ presentationId, revision: 1, autoStart })

describe('createAssignmentReconciliationRunner', () => {
  it('処理中に届いた同一Presentationの最新autoStartを再評価する', async () => {
    let releaseFirst!: () => void
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    const reconciled: Array<PresentationAssignment | null> = []
    const onError = jest.fn()
    const runner = createAssignmentReconciliationRunner(async (value) => {
      reconciled.push(value)
      if (reconciled.length === 1) await firstPending
    }, onError)

    runner(assignment(false))
    runner(assignment(true))
    releaseFirst()
    await waitFor(() => reconciled.length === 2)

    expect(reconciled).toEqual([assignment(false), assignment(true)])
    expect(onError).not.toHaveBeenCalled()
  })

  it('処理中の古い割当より後に届いた解除を最後に適用する', async () => {
    let releaseFirst!: () => void
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    const reconciled: Array<PresentationAssignment | null> = []
    const onError = jest.fn()
    const runner = createAssignmentReconciliationRunner(async (value) => {
      reconciled.push(value)
      if (reconciled.length === 1) await firstPending
    }, onError)

    runner(assignment(false))
    runner(null)
    releaseFirst()
    await waitFor(() => reconciled.length === 2)

    expect(reconciled).toEqual([assignment(false), null])
    expect(onError).not.toHaveBeenCalled()
  })
})

const waitFor = async (condition: () => boolean) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (condition()) return
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  throw new Error('condition was not met')
}
