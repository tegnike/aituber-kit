import { FC, useEffect, useRef } from 'react'
import { initializeMemoryService } from '@/features/memory/memoryStoreSync'
import { resetMemoryService } from '@/features/memory/memoryService'
import settingsStore from '@/features/stores/settings'

export const MemoryServiceInitializer: FC = () => {
  const memoryEnabled = settingsStore((s) => s.memoryEnabled)
  const prevEnabledRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (prevEnabledRef.current === memoryEnabled) return
    prevEnabledRef.current = memoryEnabled

    if (memoryEnabled) {
      initializeMemoryService()
    } else {
      resetMemoryService()
    }
  }, [memoryEnabled])

  return null
}
