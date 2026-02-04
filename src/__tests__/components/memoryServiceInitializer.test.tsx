/**
 * MemoryServiceInitializer Component Tests
 *
 * Tests for the memory service initialization component
 */

import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryServiceInitializer } from '@/components/memoryServiceInitializer'
import settingsStore from '@/features/stores/settings'

// Mock memoryStoreSync
const mockInitializeMemoryService = jest.fn().mockResolvedValue(undefined)
jest.mock('@/features/memory/memoryStoreSync', () => ({
  initializeMemoryService: (...args: unknown[]) =>
    mockInitializeMemoryService(...args),
}))

// Mock memoryService
const mockResetMemoryService = jest.fn()
jest.mock('@/features/memory/memoryService', () => ({
  resetMemoryService: (...args: unknown[]) => mockResetMemoryService(...args),
}))

describe('MemoryServiceInitializer', () => {
  const originalState = settingsStore.getState()

  beforeEach(() => {
    jest.clearAllMocks()
    settingsStore.setState(originalState)
  })

  afterEach(() => {
    settingsStore.setState(originalState)
  })

  it('should render null', () => {
    settingsStore.setState({ memoryEnabled: false })
    const { container } = render(<MemoryServiceInitializer />)
    expect(container.innerHTML).toBe('')
  })

  it('should call initializeMemoryService when memoryEnabled is true', () => {
    settingsStore.setState({ memoryEnabled: true })
    render(<MemoryServiceInitializer />)
    expect(mockInitializeMemoryService).toHaveBeenCalled()
  })

  it('should not call initializeMemoryService when memoryEnabled is false', () => {
    settingsStore.setState({ memoryEnabled: false })
    render(<MemoryServiceInitializer />)
    expect(mockInitializeMemoryService).not.toHaveBeenCalled()
  })

  it('should call resetMemoryService when memoryEnabled changes from true to false', () => {
    settingsStore.setState({ memoryEnabled: true })
    const { rerender } = render(<MemoryServiceInitializer />)

    expect(mockInitializeMemoryService).toHaveBeenCalledTimes(1)

    // Change memoryEnabled to false
    settingsStore.setState({ memoryEnabled: false })
    rerender(<MemoryServiceInitializer />)

    expect(mockResetMemoryService).toHaveBeenCalled()
  })
})
