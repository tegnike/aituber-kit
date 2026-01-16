/**
 * Memory Integration Tests
 *
 * TDD: RED phase - Tests for integrating MemoryService with homeStore and chat flow
 * Requirements: 6.1, 6.4, 6.5, 4.1, 6.3
 */

// Polyfill structuredClone for fake-indexeddb in Jest environment
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  }
}

import 'fake-indexeddb/auto'
import {
  MemoryService,
  getMemoryService,
  resetMemoryService,
} from '@/features/memory/memoryService'
import { MemoryContextBuilder } from '@/features/memory/memoryContextBuilder'
import { EMBEDDING_DIMENSION } from '@/features/memory/memoryTypes'

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

describe('Memory Integration', () => {
  let service: MemoryService

  beforeEach(async () => {
    mockFetch.mockReset()
    resetMemoryService()
    service = getMemoryService()
    await service.initialize()
  })

  afterEach(async () => {
    try {
      await service.clearAllMemories()
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('Task 7.1: homeStore and MemoryService integration', () => {
    describe('getMemoryService singleton', () => {
      it('should return the same instance on multiple calls', () => {
        const service1 = getMemoryService()
        const service2 = getMemoryService()
        expect(service1).toBe(service2)
      })

      it('should create a new instance after reset', () => {
        const service1 = getMemoryService()
        resetMemoryService()
        const service2 = getMemoryService()
        expect(service1).not.toBe(service2)
      })
    })

    describe('saveMessageToMemory', () => {
      it('should save user message when memory is enabled', async () => {
        const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })

        await service.saveMemory({
          role: 'user',
          content: 'Hello, world!',
        })

        const count = await service.getMemoryCount()
        expect(count).toBe(1)
      })

      it('should save assistant message when memory is enabled', async () => {
        const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })

        await service.saveMemory({
          role: 'assistant',
          content: 'Hello! How can I help you?',
        })

        const count = await service.getMemoryCount()
        expect(count).toBe(1)
      })

      it('should not block when API fails (graceful degradation)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'API Error' }),
        })

        // Should not throw
        await expect(
          service.saveMemory({
            role: 'user',
            content: 'Test message',
          })
        ).resolves.not.toThrow()
      })
    })

    describe('Independence from existing stores (Requirement 6.1)', () => {
      it('should operate independently from settingsStore', async () => {
        // Service should work without requiring settingsStore to be in a specific state
        const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })

        await service.saveMemory({
          role: 'user',
          content: 'Independent test',
        })

        const count = await service.getMemoryCount()
        expect(count).toBe(1)
      })
    })

    describe('chatLog compatibility (Requirement 6.4)', () => {
      it('should save messages with role compatible with chatLog', async () => {
        const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })

        await service.saveMemory({
          role: 'user',
          content: 'User message',
        })

        // Search should return compatible structure
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })

        const results = await service.searchMemories('User message', {
          threshold: 0.5,
        })
        expect(results.length).toBe(1)
        expect(results[0]).toHaveProperty('role', 'user')
        expect(results[0]).toHaveProperty('content', 'User message')
      })
    })
  })

  describe('Task 7.2: RAG integration with chat flow', () => {
    describe('searchMemories for context', () => {
      it('should find relevant memories for context building', async () => {
        // Save some memories first
        const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        await service.saveMemory({
          role: 'user',
          content: 'I like cats',
        })

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        await service.saveMemory({
          role: 'assistant',
          content: 'Cats are wonderful pets!',
        })

        // Now search with similar embedding
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })

        const results = await service.searchMemories('Tell me about cats', {
          threshold: 0.5,
          limit: 5,
        })

        expect(results.length).toBeGreaterThan(0)
      })
    })

    describe('MemoryContextBuilder integration', () => {
      it('should build context from search results', async () => {
        const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)

        // Save memories
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        await service.saveMemory({
          role: 'user',
          content: 'I love programming',
        })

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        await service.saveMemory({
          role: 'assistant',
          content: 'Programming is a great skill!',
        })

        // Search for memories
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        const memories = await service.searchMemories('programming', {
          threshold: 0.5,
        })

        // Build context
        const builder = new MemoryContextBuilder()
        const context = builder.buildContext(memories, { maxTokens: 1000 })

        expect(context).toContain('programming')
      })

      it('should handle empty search results gracefully', () => {
        const builder = new MemoryContextBuilder()
        const context = builder.buildContext([], { maxTokens: 1000 })

        expect(context).toBe('')
      })
    })

    describe('Context added to system prompt (Requirement 4.1)', () => {
      it('should produce context suitable for system prompt', async () => {
        const embedding = new Array(EMBEDDING_DIMENSION).fill(0.5)

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        await service.saveMemory({
          role: 'user',
          content: 'My name is Taro',
        })

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => createMockEmbeddingResponse(embedding),
        })
        const memories = await service.searchMemories('name', {
          threshold: 0.5,
        })

        const builder = new MemoryContextBuilder()
        const context = builder.buildContext(memories)

        // Context should be suitable for appending to system prompt
        expect(typeof context).toBe('string')
        if (context) {
          expect(context).toContain('Taro')
        }
      })
    })
  })

  describe('Graceful degradation (Requirement 6.5)', () => {
    it('should not affect existing behavior when memory is disabled', async () => {
      // When service is not initialized, operations should be no-ops
      const uninitializedService = new MemoryService()

      // These should not throw
      await expect(
        uninitializedService.saveMemory({
          role: 'user',
          content: 'Test',
        })
      ).resolves.not.toThrow()

      const results = await uninitializedService.searchMemories('test')
      expect(results).toEqual([])

      const count = await uninitializedService.getMemoryCount()
      expect(count).toBe(0)
    })
  })
})
