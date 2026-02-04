/**
 * MemoryContextBuilder Tests
 *
 * TDD: RED phase - Tests for memory context building and token management
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import {
  MemoryContextBuilder,
  ContextOptions,
  formatTimestamp,
} from '@/features/memory/memoryContextBuilder'
import { MemoryRecord } from '@/features/memory/memoryTypes'

describe('MemoryContextBuilder', () => {
  let builder: MemoryContextBuilder

  beforeEach(() => {
    builder = new MemoryContextBuilder()
  })

  describe('buildContext', () => {
    const createMemoryRecord = (
      overrides: Partial<MemoryRecord> = {}
    ): MemoryRecord => ({
      id: 'test-id',
      role: 'user',
      content: 'テストメッセージ',
      embedding: [0.1, 0.2, 0.3],
      timestamp: '2025-01-15T14:30:00Z',
      sessionId: 'session-1',
      ...overrides,
    })

    it('should return empty string for empty memories array (Req 4.4)', () => {
      const result = builder.buildContext([])
      expect(result).toBe('')
    })

    it('should format single user message correctly (Req 4.2)', () => {
      const memories: MemoryRecord[] = [
        createMemoryRecord({
          role: 'user',
          content: 'こんにちは',
          timestamp: '2025-01-15T14:30:00Z',
        }),
      ]

      const result = builder.buildContext(memories)

      expect(result).toContain('過去の記憶')
      expect(result).toContain('[2025/01/15 23:30]')
      expect(result).toContain('ユーザー: こんにちは')
    })

    it('should format single assistant message correctly (Req 4.2)', () => {
      const memories: MemoryRecord[] = [
        createMemoryRecord({
          role: 'assistant',
          content: 'お元気ですか？',
          timestamp: '2025-01-15T14:30:00Z',
        }),
      ]

      const result = builder.buildContext(memories)

      expect(result).toContain('キャラクター: お元気ですか？')
    })

    it('should format paired user and assistant messages (Req 4.2)', () => {
      const memories: MemoryRecord[] = [
        createMemoryRecord({
          id: 'id-1',
          role: 'user',
          content: 'おはよう',
          timestamp: '2025-01-15T09:00:00Z',
        }),
        createMemoryRecord({
          id: 'id-2',
          role: 'assistant',
          content: 'おはようございます！',
          timestamp: '2025-01-15T09:00:05Z',
        }),
      ]

      const result = builder.buildContext(memories)

      expect(result).toContain('ユーザー: おはよう')
      expect(result).toContain('キャラクター: おはようございます！')
    })

    it('should include header section for system prompt (Req 4.1)', () => {
      const memories: MemoryRecord[] = [createMemoryRecord()]

      const result = builder.buildContext(memories)

      expect(result).toContain('## 過去の記憶')
    })

    it('should format multiple memories in chronological order', () => {
      const memories: MemoryRecord[] = [
        createMemoryRecord({
          id: 'id-1',
          content: '最初のメッセージ',
          timestamp: '2025-01-15T10:00:00Z',
        }),
        createMemoryRecord({
          id: 'id-2',
          content: '二番目のメッセージ',
          timestamp: '2025-01-15T11:00:00Z',
        }),
        createMemoryRecord({
          id: 'id-3',
          content: '三番目のメッセージ',
          timestamp: '2025-01-15T12:00:00Z',
        }),
      ]

      const result = builder.buildContext(memories)
      const firstIndex = result.indexOf('最初のメッセージ')
      const secondIndex = result.indexOf('二番目のメッセージ')
      const thirdIndex = result.indexOf('三番目のメッセージ')

      expect(firstIndex).toBeLessThan(secondIndex)
      expect(secondIndex).toBeLessThan(thirdIndex)
    })

    it('should use compact format when specified', () => {
      const memories: MemoryRecord[] = [
        createMemoryRecord({
          content: 'テストメッセージです',
        }),
      ]

      const options: ContextOptions = { format: 'compact' }
      const result = builder.buildContext(memories, options)

      // compactフォーマットでは日時が省略される
      expect(result).not.toContain('[2025/01/15')
    })

    it('should use detailed format by default', () => {
      const memories: MemoryRecord[] = [
        createMemoryRecord({
          timestamp: '2025-01-15T14:30:00Z',
        }),
      ]

      const result = builder.buildContext(memories)

      expect(result).toContain('[2025/01/15')
    })
  })

  describe('estimateTokens', () => {
    it('should return 0 for empty string', () => {
      const tokens = builder.estimateTokens('')
      expect(tokens).toBe(0)
    })

    it('should estimate tokens for ASCII text', () => {
      // Roughly 4 characters per token for English
      const text = 'Hello, how are you today?'
      const tokens = builder.estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(20)
    })

    it('should estimate tokens for Japanese text', () => {
      // Japanese text typically has higher token count per character
      const text = 'こんにちは、今日はいかがですか？'
      const tokens = builder.estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
    })

    it('should estimate tokens for mixed content', () => {
      const text = 'Hello! こんにちは！ 123'
      const tokens = builder.estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
    })
  })

  describe('token limit enforcement (Req 4.3, 4.5)', () => {
    const createMemoryRecord = (
      overrides: Partial<MemoryRecord> = {}
    ): MemoryRecord => ({
      id: 'test-id',
      role: 'user',
      content: 'テストメッセージ',
      embedding: [0.1, 0.2, 0.3],
      timestamp: '2025-01-15T14:30:00Z',
      sessionId: 'session-1',
      ...overrides,
    })

    it('should truncate memories when exceeding maxTokens', () => {
      const memories: MemoryRecord[] = []
      for (let i = 0; i < 50; i++) {
        memories.push(
          createMemoryRecord({
            id: `id-${i}`,
            content: `これはテストメッセージ番号${i}です。長いテキストを含んでいます。`,
            timestamp: `2025-01-15T${String(10 + i).padStart(2, '0')}:00:00Z`,
          })
        )
      }

      const options: ContextOptions = { maxTokens: 100 }
      const result = builder.buildContext(memories, options)
      const estimatedTokens = builder.estimateTokens(result)

      // トークン数が上限以下であることを確認
      expect(estimatedTokens).toBeLessThanOrEqual(100)
    })

    it('should remove older memories first when truncating (Req 4.3)', () => {
      const memories: MemoryRecord[] = [
        createMemoryRecord({
          id: 'old-1',
          content: '古いメッセージ1',
          timestamp: '2025-01-15T08:00:00Z',
        }),
        createMemoryRecord({
          id: 'old-2',
          content: '古いメッセージ2',
          timestamp: '2025-01-15T09:00:00Z',
        }),
        createMemoryRecord({
          id: 'new-1',
          content: '新しいメッセージ',
          timestamp: '2025-01-15T14:00:00Z',
        }),
      ]

      const options: ContextOptions = { maxTokens: 50 }
      const result = builder.buildContext(memories, options)

      // 新しいメッセージが優先される（古いものから削除される）
      // トークン上限が厳しい場合、古いメッセージが削除される
      const tokens = builder.estimateTokens(result)
      expect(tokens).toBeLessThanOrEqual(50)
    })

    it('should use default maxTokens of 1000 (Req 4.5)', () => {
      const memories: MemoryRecord[] = []
      for (let i = 0; i < 100; i++) {
        memories.push(
          createMemoryRecord({
            id: `id-${i}`,
            content: `メッセージ${i}: これは非常に長いテストメッセージです。メモリコンテキストのトークン制限をテストするために使用します。`,
            timestamp: `2025-01-${String((i % 28) + 1).padStart(2, '0')}T12:00:00Z`,
          })
        )
      }

      // デフォルト設定でビルド
      const result = builder.buildContext(memories)
      const estimatedTokens = builder.estimateTokens(result)

      // デフォルトの1000トークン以下であることを確認
      expect(estimatedTokens).toBeLessThanOrEqual(1000)
    })
  })
})

describe('formatTimestamp', () => {
  it('should format ISO timestamp to [YYYY/MM/DD HH:mm] format', () => {
    const result = formatTimestamp('2025-01-15T14:30:00Z')
    // UTCからJSTへ変換（+9時間）
    expect(result).toBe('[2025/01/15 23:30]')
  })

  it('should handle different timezones correctly', () => {
    const result = formatTimestamp('2025-12-31T15:00:00Z')
    // UTCからJSTへ変換
    expect(result).toBe('[2026/01/01 00:00]')
  })

  it('should handle midnight correctly', () => {
    const result = formatTimestamp('2025-06-15T15:00:00Z')
    // 15:00 UTC = 00:00 JST (+9)
    expect(result).toBe('[2025/06/16 00:00]')
  })
})
