import type { PresentationAssignment } from '@/features/presentation/presentationTypes'

export const createAssignmentReconciliationRunner = (
  reconcile: (assignment: PresentationAssignment | null) => Promise<void>,
  onError: (error: unknown) => void
) => {
  let pending: {
    generation: number
    assignment: PresentationAssignment | null
  } | null = null
  let generation = 0
  let completedGeneration = 0
  let running = false

  const drain = async () => {
    if (running) return
    running = true
    try {
      while (pending && pending.generation > completedGeneration) {
        const current = pending
        try {
          await reconcile(current.assignment)
        } catch (error) {
          onError(error)
        } finally {
          completedGeneration = current.generation
        }
      }
    } finally {
      running = false
      if (pending && pending.generation > completedGeneration) void drain()
    }
  }

  return (assignment: PresentationAssignment | null) => {
    pending = { generation: ++generation, assignment }
    void drain()
  }
}
