/**
 * MemoryStoreSync Tests
 *
 * TDD: Tests for synchronization between homeStore and MemoryService
 * Requirements: 6.1, 6.3, 6.4, 6.5
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
  initializeMemoryService,
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

describe('MemoryStoreSync', () => {
  const originalState = settingsStore.getState()

  beforeEach(async () => {
    mockFetch.mockReset()
    resetMemoryService()

    // Reset settings to enable memory
    settingsStore.setState({
      memoryEnabled: true,
      memorySimilarityThreshold: 0.7,
      memorySearchLimit: 5,
      memoryMaxContextTokens: 1000,
    })
  })

  afterEach(async () => {
    // Restore original settings
    settingsStore.setState(originalState)

    try {
      const service = getMemoryService()
      await service.clearAllMemories()
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('saveMessageToMemory', () => {
    it('should save user message when memory is enabled', async () => {
      const service = getMemoryService()
      await service.initialize()

      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      await saveMessageToMemory({
        role: 'user',
        content: 'Hello, world!',
      })

      const count = await service.getMemoryCount()
      expect(count).toBe(1)
    })

    it('should save assistant message when memory is enabled', async () => {
      const service = getMemoryService()
      await service.initialize()

      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      await saveMessageToMemory({
        role: 'assistant',
        content: 'Hello! How can I help you?',
      })

      const count = await service.getMemoryCount()
      expect(count).toBe(1)
    })

    it('should not save when memory is disabled (Requirement 6.5)', async () => {
      settingsStore.setState({ memoryEnabled: false })

      const service = getMemoryService()
      await service.initialize()

      await saveMessageToMemory({
        role: 'user',
        content: 'This should not be saved',
      })

      // fetch should not be called
      expect(mockFetch).not.toHaveBeenCalled()

      const count = await service.getMemoryCount()
      expect(count).toBe(0)
    })

    it('should not save system messages', async () => {
      const service = getMemoryService()
      await service.initialize()

      await saveMessageToMemory({
        role: 'system',
        content: 'System prompt',
      })

      // fetch should not be called
      expect(mockFetch).not.toHaveBeenCalled()

      const count = await service.getMemoryCount()
      expect(count).toBe(0)
    })

    it('should not save code messages', async () => {
      const service = getMemoryService()
      await service.initialize()

      await saveMessageToMemory({
        role: 'code',
        content: 'console.log("test")',
      })

      // fetch should not be called
      expect(mockFetch).not.toHaveBeenCalled()

      const count = await service.getMemoryCount()
      expect(count).toBe(0)
    })

    it('should extract text from multimodal messages', async () => {
      const service = getMemoryService()
      await service.initialize()

      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      await saveMessageToMemory({
        role: 'user',
        content: [
          { type: 'text', text: 'Look at this image' },
          { type: 'image', image: 'base64data...' },
        ],
      })

      const count = await service.getMemoryCount()
      expect(count).toBe(1)

      // Verify the API was called with the text content
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/embedding',
        expect.objectContaining({
          body: expect.stringContaining('Look at this image'),
        })
      )
    })

    it('should not throw when service is not initialized', async () => {
      // Service is not initialized

      await expect(
        saveMessageToMemory({
          role: 'user',
          content: 'Test message',
        })
      ).resolves.not.toThrow()
    })

    it('should not throw when API fails (graceful degradation)', async () => {
      const service = getMemoryService()
      await service.initialize()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error' }),
      })

      await expect(
        saveMessageToMemory({
          role: 'user',
          content: 'Test message',
        })
      ).resolves.not.toThrow()
    })
  })

  describe('searchMemoryContext', () => {
    it('should return memory context when memories exist', async () => {
      const service = getMemoryService()
      await service.initialize()

      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)

      // Save some memories
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })
      await saveMessageToMemory({
        role: 'user',
        content: 'I like TypeScript',
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })
      await saveMessageToMemory({
        role: 'assistant',
        content: 'TypeScript is great!',
      })

      // Search for context
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })
      const context = await searchMemoryContext('TypeScript')

      expect(context).toContain('TypeScript')
    })

    it('should return empty string when memory is disabled', async () => {
      settingsStore.setState({ memoryEnabled: false })

      const context = await searchMemoryContext('test query')

      expect(context).toBe('')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should return empty string when service is not initialized', async () => {
      // Service is not initialized

      const context = await searchMemoryContext('test query')

      expect(context).toBe('')
    })

    it('should return empty string when no memories match', async () => {
      const service = getMemoryService()
      await service.initialize()

      // No memories saved, mock the query embedding
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(),
      })

      const context = await searchMemoryContext('test query')

      expect(context).toBe('')
    })

    it('should respect similarity threshold from settings', async () => {
      const service = getMemoryService()
      await service.initialize()

      settingsStore.setState({ memorySimilarityThreshold: 0.95 })

      // Save a memory
      const embedding1 = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding1),
      })
      await saveMessageToMemory({
        role: 'user',
        content: 'Test memory',
      })

      // Query with opposite direction embedding (very low similarity)
      const queryEmbedding = new Array(EMBEDDING_DIMENSION).fill(-0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(queryEmbedding),
      })

      const context = await searchMemoryContext('Different query')

      // High threshold should filter out the memory due to very low similarity
      expect(context).toBe('')
    })

    it('should not throw when API fails', async () => {
      const service = getMemoryService()
      await service.initialize()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error' }),
      })

      await expect(searchMemoryContext('test query')).resolves.not.toThrow()
    })
  })

  describe('initializeMemoryService', () => {
    it('should initialize the service when memory is enabled', async () => {
      await initializeMemoryService()

      const service = getMemoryService()
      expect(service.isAvailable()).toBe(true)
    })

    it('should not initialize when memory is disabled', async () => {
      settingsStore.setState({ memoryEnabled: false })

      await initializeMemoryService()

      const service = getMemoryService()
      expect(service.isAvailable()).toBe(false)
    })

    it('should not throw on initialization failure', async () => {
      // This should not throw even if there's an error
      await expect(initializeMemoryService()).resolves.not.toThrow()
    })
  })
})
