/**
 * MemoryStore Tests
 *
 * TDD: RED phase - Tests for IndexedDB operations via MemoryStore
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

// Polyfill structuredClone for fake-indexeddb in Jest environment
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  }
}

import 'fake-indexeddb/auto'
import {
  MemoryStore,
  DB_NAME,
  DB_VERSION,
  STORE_NAME,
} from '@/features/memory/memoryStore'
import { MemoryRecord } from '@/features/memory/memoryTypes'

// Helper function to create test memory records
function createTestRecord(overrides: Partial<MemoryRecord> = {}): MemoryRecord {
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role: 'user',
    content: 'Test message',
    embedding: new Array(1536).fill(0.1),
    timestamp: new Date().toISOString(),
    sessionId: 'test-session-1',
    ...overrides,
  }
}

describe('MemoryStore', () => {
  let store: MemoryStore

  beforeEach(async () => {
    // Create a fresh store instance for each test
    store = new MemoryStore()
    await store.open()
  })

  afterEach(async () => {
    // Clean up after each test
    await store.clear()
    await store.close()
  })

  describe('Database constants', () => {
    it('should have correct database name', () => {
      expect(DB_NAME).toBe('aituber-memory')
    })

    it('should have correct database version', () => {
      expect(DB_VERSION).toBe(1)
    })

    it('should have correct store name', () => {
      expect(STORE_NAME).toBe('memories')
    })
  })

  describe('open()', () => {
    it('should open the database successfully', async () => {
      const newStore = new MemoryStore()
      await expect(newStore.open()).resolves.not.toThrow()
      await newStore.close()
    })

    it('should create the memories object store', async () => {
      // The store should be accessible after opening
      const count = await store.count()
      expect(typeof count).toBe('number')
    })
  })

  describe('put()', () => {
    it('should save a memory record', async () => {
      const record = createTestRecord({ id: 'unique-id-1' })
      await expect(store.put(record)).resolves.not.toThrow()
    })

    it('should save a record with null embedding', async () => {
      const record = createTestRecord({ id: 'unique-id-2', embedding: null })
      await store.put(record)

      const retrieved = await store.getAll()
      const found = retrieved.find((r) => r.id === 'unique-id-2')
      expect(found?.embedding).toBeNull()
    })

    it('should update existing record with same id', async () => {
      const record = createTestRecord({
        id: 'update-test',
        content: 'Original',
      })
      await store.put(record)

      const updated = { ...record, content: 'Updated' }
      await store.put(updated)

      const retrieved = await store.getAll()
      const found = retrieved.find((r) => r.id === 'update-test')
      expect(found?.content).toBe('Updated')
    })
  })

  describe('getAll()', () => {
    it('should return empty array when no records exist', async () => {
      const records = await store.getAll()
      expect(records).toEqual([])
    })

    it('should return all saved records', async () => {
      const record1 = createTestRecord({ id: 'id-1' })
      const record2 = createTestRecord({ id: 'id-2' })

      await store.put(record1)
      await store.put(record2)

      const records = await store.getAll()
      expect(records).toHaveLength(2)
    })

    it('should return records with correct structure', async () => {
      const record = createTestRecord({
        id: 'structure-test',
        role: 'assistant',
        content: 'Hello there!',
        sessionId: 'session-abc',
      })
      await store.put(record)

      const records = await store.getAll()
      const found = records.find((r) => r.id === 'structure-test')

      expect(found).toMatchObject({
        id: 'structure-test',
        role: 'assistant',
        content: 'Hello there!',
        sessionId: 'session-abc',
      })
    })
  })

  describe('getBySessionId()', () => {
    it('should return empty array for non-existent session', async () => {
      const records = await store.getBySessionId('non-existent')
      expect(records).toEqual([])
    })

    it('should return only records from specified session', async () => {
      const record1 = createTestRecord({
        id: 'session-a-1',
        sessionId: 'session-a',
      })
      const record2 = createTestRecord({
        id: 'session-a-2',
        sessionId: 'session-a',
      })
      const record3 = createTestRecord({
        id: 'session-b-1',
        sessionId: 'session-b',
      })

      await store.put(record1)
      await store.put(record2)
      await store.put(record3)

      const sessionARecords = await store.getBySessionId('session-a')
      expect(sessionARecords).toHaveLength(2)
      expect(sessionARecords.every((r) => r.sessionId === 'session-a')).toBe(
        true
      )
    })
  })

  describe('getRecentMessages()', () => {
    it('should return empty array when no records exist', async () => {
      const records = await store.getRecentMessages(5)
      expect(records).toEqual([])
    })

    it('should return up to limit number of records', async () => {
      for (let i = 0; i < 10; i++) {
        await store.put(
          createTestRecord({
            id: `msg-${i}`,
            timestamp: new Date(Date.now() + i * 1000).toISOString(),
          })
        )
      }

      const records = await store.getRecentMessages(5)
      expect(records).toHaveLength(5)
    })

    it('should return records sorted by timestamp descending (most recent first)', async () => {
      const baseTime = Date.now()
      await store.put(
        createTestRecord({
          id: 'old',
          timestamp: new Date(baseTime).toISOString(),
        })
      )
      await store.put(
        createTestRecord({
          id: 'new',
          timestamp: new Date(baseTime + 10000).toISOString(),
        })
      )
      await store.put(
        createTestRecord({
          id: 'middle',
          timestamp: new Date(baseTime + 5000).toISOString(),
        })
      )

      const records = await store.getRecentMessages(3)
      expect(records[0].id).toBe('new')
      expect(records[1].id).toBe('middle')
      expect(records[2].id).toBe('old')
    })
  })

  describe('clear()', () => {
    it('should remove all records', async () => {
      await store.put(createTestRecord({ id: 'to-clear-1' }))
      await store.put(createTestRecord({ id: 'to-clear-2' }))

      await store.clear()

      const records = await store.getAll()
      expect(records).toEqual([])
    })

    it('should not throw on empty database', async () => {
      await expect(store.clear()).resolves.not.toThrow()
    })
  })

  describe('count()', () => {
    it('should return 0 for empty database', async () => {
      const count = await store.count()
      expect(count).toBe(0)
    })

    it('should return correct count after adding records', async () => {
      await store.put(createTestRecord({ id: 'count-1' }))
      await store.put(createTestRecord({ id: 'count-2' }))
      await store.put(createTestRecord({ id: 'count-3' }))

      const count = await store.count()
      expect(count).toBe(3)
    })

    it('should update count after clearing', async () => {
      await store.put(createTestRecord({ id: 'count-clear-1' }))
      await store.put(createTestRecord({ id: 'count-clear-2' }))

      await store.clear()

      const count = await store.count()
      expect(count).toBe(0)
    })
  })

  describe('Non-blocking behavior', () => {
    it('should handle multiple concurrent writes', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        store.put(createTestRecord({ id: `concurrent-${i}` }))
      )

      await expect(Promise.all(promises)).resolves.not.toThrow()

      const count = await store.count()
      expect(count).toBe(10)
    })

    it('should handle concurrent read and write', async () => {
      await store.put(createTestRecord({ id: 'initial-record' }))

      const [writeResult, readResult] = await Promise.all([
        store.put(createTestRecord({ id: 'concurrent-write' })),
        store.getAll(),
      ])

      // Should not throw
      expect(writeResult).toBeUndefined()
      expect(Array.isArray(readResult)).toBe(true)
    })
  })
})

describe('Browser Compatibility', () => {
  describe('isIndexedDBSupported()', () => {
    it('should return true when IndexedDB is available', () => {
      const { isIndexedDBSupported } = require('@/features/memory/memoryStore')
      // fake-indexeddb provides IndexedDB in test environment
      expect(isIndexedDBSupported()).toBe(true)
    })
  })

  describe('MemoryStore with compatibility check', () => {
    let store: MemoryStore

    beforeEach(() => {
      store = new MemoryStore()
    })

    afterEach(async () => {
      try {
        await store.close()
      } catch {
        // Ignore close errors
      }
    })

    it('should check compatibility before opening', async () => {
      const { isIndexedDBSupported } = require('@/features/memory/memoryStore')

      if (isIndexedDBSupported()) {
        await expect(store.open()).resolves.not.toThrow()
      }
    })
  })
})
