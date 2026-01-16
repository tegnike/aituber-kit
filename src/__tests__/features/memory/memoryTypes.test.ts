/**
 * Memory Types and Utility Functions Tests
 *
 * TDD: RED phase - Tests for memory types and cosine similarity
 */

import {
  EMBEDDING_DIMENSION,
  cosineSimilarity,
  MemoryRecord,
  SearchOptions,
  MemoryConfig,
} from '@/features/memory/memoryTypes'

describe('Memory Types and Constants', () => {
  describe('EMBEDDING_DIMENSION', () => {
    it('should be 1536 for text-embedding-3-small model', () => {
      expect(EMBEDDING_DIMENSION).toBe(1536)
    })
  })

  describe('MemoryRecord type', () => {
    it('should create a valid MemoryRecord', () => {
      const record: MemoryRecord = {
        id: 'test-id-123',
        role: 'user',
        content: 'Hello, how are you?',
        embedding: new Array(1536).fill(0.1),
        timestamp: '2025-01-01T00:00:00Z',
        sessionId: 'session-123',
      }

      expect(record.id).toBe('test-id-123')
      expect(record.role).toBe('user')
      expect(record.content).toBe('Hello, how are you?')
      expect(record.embedding).toHaveLength(1536)
      expect(record.timestamp).toBe('2025-01-01T00:00:00Z')
      expect(record.sessionId).toBe('session-123')
    })

    it('should allow null embedding when not yet vectorized', () => {
      const record: MemoryRecord = {
        id: 'test-id-456',
        role: 'assistant',
        content: 'I am fine, thank you!',
        embedding: null,
        timestamp: '2025-01-01T00:00:01Z',
        sessionId: 'session-123',
      }

      expect(record.embedding).toBeNull()
    })
  })

  describe('SearchOptions type', () => {
    it('should have default values', () => {
      const options: SearchOptions = {}

      expect(options.threshold).toBeUndefined()
      expect(options.limit).toBeUndefined()
    })

    it('should accept custom values', () => {
      const options: SearchOptions = {
        threshold: 0.8,
        limit: 10,
      }

      expect(options.threshold).toBe(0.8)
      expect(options.limit).toBe(10)
    })
  })

  describe('MemoryConfig type', () => {
    it('should have all required fields', () => {
      const config: MemoryConfig = {
        memoryEnabled: true,
        memorySimilarityThreshold: 0.7,
        memorySearchLimit: 5,
        memoryMaxContextTokens: 1000,
      }

      expect(config.memoryEnabled).toBe(true)
      expect(config.memorySimilarityThreshold).toBe(0.7)
      expect(config.memorySearchLimit).toBe(5)
      expect(config.memoryMaxContextTokens).toBe(1000)
    })
  })
})

describe('Cosine Similarity', () => {
  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vector = [1, 2, 3, 4, 5]
      const similarity = cosineSimilarity(vector, vector)
      expect(similarity).toBeCloseTo(1.0, 5)
    })

    it('should return -1 for opposite vectors', () => {
      const vectorA = [1, 2, 3]
      const vectorB = [-1, -2, -3]
      const similarity = cosineSimilarity(vectorA, vectorB)
      expect(similarity).toBeCloseTo(-1.0, 5)
    })

    it('should return 0 for orthogonal vectors', () => {
      const vectorA = [1, 0, 0]
      const vectorB = [0, 1, 0]
      const similarity = cosineSimilarity(vectorA, vectorB)
      expect(similarity).toBeCloseTo(0.0, 5)
    })

    it('should handle normalized vectors correctly', () => {
      // Two unit vectors at 60 degrees - cosine(60°) = 0.5
      const vectorA = [1, 0]
      const vectorB = [0.5, Math.sqrt(3) / 2]
      const similarity = cosineSimilarity(vectorA, vectorB)
      expect(similarity).toBeCloseTo(0.5, 5)
    })

    it('should handle high-dimensional vectors (1536 dim)', () => {
      const vectorA = new Array(1536).fill(0).map((_, i) => Math.sin(i))
      const vectorB = new Array(1536).fill(0).map((_, i) => Math.sin(i))
      const similarity = cosineSimilarity(vectorA, vectorB)
      expect(similarity).toBeCloseTo(1.0, 5)
    })

    it('should return 0 for zero vectors', () => {
      const vectorA = [0, 0, 0]
      const vectorB = [1, 2, 3]
      const similarity = cosineSimilarity(vectorA, vectorB)
      expect(similarity).toBe(0)
    })

    it('should throw error for vectors of different lengths', () => {
      const vectorA = [1, 2, 3]
      const vectorB = [1, 2]
      expect(() => cosineSimilarity(vectorA, vectorB)).toThrow()
    })

    it('should be symmetric', () => {
      const vectorA = [1, 2, 3, 4]
      const vectorB = [5, 6, 7, 8]
      const simAB = cosineSimilarity(vectorA, vectorB)
      const simBA = cosineSimilarity(vectorB, vectorA)
      expect(simAB).toBeCloseTo(simBA, 10)
    })
  })
})
