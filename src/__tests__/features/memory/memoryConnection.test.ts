/**
 * Memory Connection Tests
 *
 * Tests for verifying IndexedDB memory save/search/count integration
 */

// Polyfill structuredClone for fake-indexeddb in Jest environment
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  }
}

import 'fake-indexeddb/auto'
import {
  saveMessageToMemory,
  searchMemoryContext,
} from '@/features/memory/memoryStoreSync'
import {
  getMemoryService,
  resetMemoryService,
} from '@/features/memory/memoryService'
import { EMBEDDING_DIMENSION } from '@/features/memory/memoryTypes'
import settingsStore from '@/features/stores/settings'

// Mock fetch for Embedding API
const mockFetch = jest.fn()
global.fetch = mockFetch

// Helper function to create a valid embedding vector
function createMockEmbedding(): number[] {
  return new Array(EMBEDDING_DIMENSION).fill(0).map(() => Math.random() - 0.5)
}

// Helper function to create a mock embedding response
function createMockEmbeddingResponse(
  embedding: number[] = createMockEmbedding()
) {
  return {
    embedding,
    model: 'text-embedding-3-small',
    usage: {
      prompt_tokens: 10,
      total_tokens: 10,
    },
  }
}

describe('Memory Connection Integration', () => {
  const originalState = settingsStore.getState()

  beforeEach(async () => {
    mockFetch.mockReset()
    resetMemoryService()

    settingsStore.setState({
      memoryEnabled: true,
      memorySimilarityThreshold: 0.7,
      memorySearchLimit: 5,
      memoryMaxContextTokens: 1000,
    })
  })

  afterEach(async () => {
    settingsStore.setState(originalState)

    try {
      const service = getMemoryService()
      await service.clearAllMemories()
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('saveMessageToMemory - user messages', () => {
    it('should save user message to IndexedDB', async () => {
      const service = getMemoryService()
      await service.initialize()

      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      await saveMessageToMemory({
        role: 'user',
        content: 'Hello from user',
        timestamp: new Date().toISOString(),
      })

      const count = await service.getMemoryCount()
      expect(count).toBe(1)
    })
  })

  describe('saveMessageToMemory - assistant messages', () => {
    it('should save assistant message to IndexedDB', async () => {
      const service = getMemoryService()
      await service.initialize()

      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      await saveMessageToMemory({
        role: 'assistant',
        content: 'Hello from assistant',
      })

      const count = await service.getMemoryCount()
      expect(count).toBe(1)
    })
  })

  describe('saveMessageToMemory - disabled', () => {
    it('should not save when memoryEnabled is false', async () => {
      settingsStore.setState({ memoryEnabled: false })

      const service = getMemoryService()
      await service.initialize()

      await saveMessageToMemory({
        role: 'user',
        content: 'This should not be saved',
      })

      expect(mockFetch).not.toHaveBeenCalled()
      const count = await service.getMemoryCount()
      expect(count).toBe(0)
    })
  })

  describe('searchMemoryContext', () => {
    it('should search and return related memories', async () => {
      const service = getMemoryService()
      await service.initialize()

      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)

      // Save a memory
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })
      await saveMessageToMemory({
        role: 'user',
        content: 'I love programming in TypeScript',
      })

      // Search with same embedding direction (high similarity)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })
      const context = await searchMemoryContext('TypeScript programming')

      expect(context).toContain('TypeScript')
    })

    it('should return empty string when no memories exist', async () => {
      const service = getMemoryService()
      await service.initialize()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(),
      })
      const context = await searchMemoryContext('anything')

      expect(context).toBe('')
    })
  })

  describe('fetchMemoryCount after initialization', () => {
    it('should return correct count after saving messages', async () => {
      const service = getMemoryService()
      await service.initialize()

      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)

      // Save two messages
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })
      await saveMessageToMemory({
        role: 'user',
        content: 'First message',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })
      await saveMessageToMemory({
        role: 'assistant',
        content: 'Second message',
      })

      const count = await service.getMemoryCount()
      expect(count).toBe(2)
    })

    it('should return 0 when no messages are saved', async () => {
      const service = getMemoryService()
      await service.initialize()

      const count = await service.getMemoryCount()
      expect(count).toBe(0)
    })
  })
})
