import { selectLiveHistory } from '@/features/live/history'

const messages = Array.from({ length: 150 }, (_, i) => ({
  role: i % 2 ? 'assistant' : 'user',
  content: String(i),
}))

test.each([1, 10, 35])('honors the configured history count %i', (count) => {
  expect(selectLiveHistory(messages, count)).toEqual(messages.slice(-count))
})
test('caps at the API limit and handles zero without sending all history', () => {
  expect(selectLiveHistory(messages, 9999)).toEqual(messages.slice(-128))
  expect(selectLiveHistory(messages, 0)).toEqual([])
})
test('filters unsupported content without truncating long messages', () => {
  const history = selectLiveHistory(
    [
      ...Array.from({ length: 5 }, () => ({
        role: 'user',
        content: 'x'.repeat(3000),
      })),
      { role: 'system', content: 'not history' },
      { role: 'user', content: [] },
    ],
    10
  )
  expect(history).toHaveLength(5)
  expect(history.every((m) => m.content === 'x'.repeat(3000))).toBe(true)
  expect(history.reduce((n, m) => n + m.content.length, 0)).toBe(15000)
})
