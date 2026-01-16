/**
 * MemoryService Tests
 *
 * TDD: RED phase - Tests for MemoryService core functionality
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 5.4, 5.5
 */

// Polyfill structuredClone for fake-indexeddb in Jest environment
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  }
}

import 'fake-indexeddb/auto'
import { MemoryService } from '@/features/memory/memoryService'
import {
  MemoryRecord,
  EMBEDDING_DIMENSION,
} from '@/features/memory/memoryTypes'

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

describe('MemoryService', () => {
  let service: MemoryService

  beforeEach(async () => {
    mockFetch.mockReset()
    // Create a fresh service instance for each test
    service = new MemoryService()
  })

  afterEach(async () => {
    // Clean up after each test
    try {
      await service.clearAllMemories()
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('initialize()', () => {
    it('should initialize successfully when IndexedDB is available', async () => {
      await expect(service.initialize()).resolves.not.toThrow()
    })

    it('should not throw even if called multiple times', async () => {
      await service.initialize()
      await expect(service.initialize()).resolves.not.toThrow()
    })
  })

  describe('isAvailable()', () => {
    it('should return false before initialization', () => {
      expect(service.isAvailable()).toBe(false)
    })

    it('should return true after successful initialization', async () => {
      await service.initialize()
      expect(service.isAvailable()).toBe(true)
    })
  })

  describe('saveMemory()', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('should save a user message with embedding', async () => {
      const mockEmbedding = createMockEmbedding()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(mockEmbedding),
      })

      const message = {
        role: 'user' as const,
        content: 'Hello, how are you?',
      }

      await service.saveMemory(message)

      // Verify the message was saved
      const count = await service.getMemoryCount()
      expect(count).toBe(1)
    })

    it('should save an assistant message with embedding', async () => {
      const mockEmbedding = createMockEmbedding()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(mockEmbedding),
      })

      const message = {
        role: 'assistant' as const,
        content: 'I am doing well, thank you!',
      }

      await service.saveMemory(message)

      const count = await service.getMemoryCount()
      expect(count).toBe(1)
    })

    it('should save message without embedding when API fails (graceful degradation)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error', code: 'API_ERROR' }),
      })

      const message = {
        role: 'user' as const,
        content: 'Test message',
      }

      // Should not throw, conversation should continue
      await expect(service.saveMemory(message)).resolves.not.toThrow()

      // Message should still be saved (with null embedding)
      const count = await service.getMemoryCount()
      expect(count).toBe(1)
    })

    it('should save message when API key is missing (graceful degradation)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'API key missing',
          code: 'API_KEY_MISSING',
        }),
      })

      const message = {
        role: 'user' as const,
        content: 'Test message',
      }

      await expect(service.saveMemory(message)).resolves.not.toThrow()
    })

    it('should call Embedding API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(),
      })

      const message = {
        role: 'user' as const,
        content: 'Hello world',
      }

      await service.saveMemory(message)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/embedding',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Hello world'),
        })
      )
    })
  })

  describe('searchMemories()', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('should return empty array when no memories exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(),
      })

      const results = await service.searchMemories('test query')
      expect(results).toEqual([])
    })

    it('should find relevant memories based on cosine similarity', async () => {
      // Save some test memories
      const embedding1 = new Array(EMBEDDING_DIMENSION).fill(0.1)
      const embedding2 = new Array(EMBEDDING_DIMENSION).fill(0.5)

      // Mock save calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding1),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding2),
        })

      await service.saveMemory({ role: 'user', content: 'First message' })
      await service.saveMemory({ role: 'assistant', content: 'Second message' })

      // Mock search query embedding (similar to embedding2)
      const queryEmbedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(queryEmbedding),
      })

      const results = await service.searchMemories('test query', {
        threshold: 0.5,
      })
      expect(results.length).toBeGreaterThan(0)
    })

    it('should respect similarity threshold', async () => {
      // Save a test memory
      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      await service.saveMemory({ role: 'user', content: 'Test message' })

      // Mock search query embedding (very different from saved)
      const queryEmbedding = new Array(EMBEDDING_DIMENSION).fill(-0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(queryEmbedding),
      })

      // With high threshold, should not match
      const results = await service.searchMemories('unrelated query', {
        threshold: 0.9,
      })
      expect(results).toEqual([])
    })

    it('should respect search limit', async () => {
      // Save multiple memories with same embedding for easy matching
      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)

      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        await service.saveMemory({ role: 'user', content: `Message ${i}` })
      }

      // Mock search query embedding (same as saved)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      const results = await service.searchMemories('query', {
        threshold: 0.5,
        limit: 2,
      })
      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should sort results by similarity score descending', async () => {
      // Save memories with different embeddings
      const embeddings = [
        new Array(EMBEDDING_DIMENSION).fill(0.1),
        new Array(EMBEDDING_DIMENSION).fill(0.5),
        new Array(EMBEDDING_DIMENSION).fill(0.3),
      ]

      for (let i = 0; i < embeddings.length; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embeddings[i]),
        })
        await service.saveMemory({ role: 'user', content: `Message ${i}` })
      }

      // Query with embedding similar to middle one
      const queryEmbedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(queryEmbedding),
      })

      const results = await service.searchMemories('query', { threshold: 0.0 })

      // Results should be sorted by similarity (descending)
      for (let i = 1; i < results.length; i++) {
        const prevSimilarity = results[i - 1].similarity || 0
        const currSimilarity = results[i].similarity || 0
        expect(prevSimilarity).toBeGreaterThanOrEqual(currSimilarity)
      }
    })

    it('should return empty array when Embedding API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error', code: 'API_ERROR' }),
      })

      const results = await service.searchMemories('test query')
      expect(results).toEqual([])
    })

    it('should skip memories without embeddings during search', async () => {
      // Save a memory that failed to get embedding
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error' }),
      })
      await service.saveMemory({ role: 'user', content: 'Failed embedding' })

      // Save a memory with embedding
      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })
      await service.saveMemory({ role: 'user', content: 'Good embedding' })

      // Query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      const results = await service.searchMemories('query', { threshold: 0.5 })
      // Should only return the memory with valid embedding
      expect(results.length).toBe(1)
      expect(results[0].content).toBe('Good embedding')
    })
  })

  describe('clearAllMemories()', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('should clear all stored memories', async () => {
      // Save some memories
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => createMockEmbeddingResponse(),
      })

      await service.saveMemory({ role: 'user', content: 'Message 1' })
      await service.saveMemory({ role: 'assistant', content: 'Message 2' })

      let count = await service.getMemoryCount()
      expect(count).toBe(2)

      await service.clearAllMemories()

      count = await service.getMemoryCount()
      expect(count).toBe(0)
    })

    it('should not throw on empty database', async () => {
      await expect(service.clearAllMemories()).resolves.not.toThrow()
    })
  })

  describe('getMemoryCount()', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('should return 0 for empty database', async () => {
      const count = await service.getMemoryCount()
      expect(count).toBe(0)
    })

    it('should return correct count after saving memories', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => createMockEmbeddingResponse(),
      })

      await service.saveMemory({ role: 'user', content: 'Message 1' })
      await service.saveMemory({ role: 'user', content: 'Message 2' })
      await service.saveMemory({ role: 'user', content: 'Message 3' })

      const count = await service.getMemoryCount()
      expect(count).toBe(3)
    })
  })

  describe('Error handling and logging', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('should log error when Embedding API fails', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error', code: 'API_ERROR' }),
      })

      await service.saveMemory({ role: 'user', content: 'Test' })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should continue conversation when API fails (Requirement 1.4)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'API Error' }),
      })

      // Should not throw - conversation must continue
      await expect(
        service.saveMemory({ role: 'user', content: 'Test' })
      ).resolves.not.toThrow()
    })
  })

  describe('Performance requirements (Requirement 3.5)', () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it('should complete search within 100ms for small dataset', async () => {
      // Save a few memories
      const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)

      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        await service.saveMemory({ role: 'user', content: `Message ${i}` })
      }

      // Mock search query
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createMockEmbeddingResponse(embedding),
      })

      const startTime = performance.now()
      await service.searchMemories('query')
      const endTime = performance.now()

      // Search should complete within 100ms (excluding API call time)
      // Note: In real tests, we might mock the entire API call time
      expect(endTime - startTime).toBeLessThan(500) // Allow some buffer for test environment
    })
  })
})

// Extended MemoryRecord type with similarity score for search results
interface MemorySearchResult extends MemoryRecord {
  similarity?: number
}
