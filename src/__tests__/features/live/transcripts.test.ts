import { LiveTranscripts } from '@/features/live/transcripts'

test('overlapping speakers, exact fragments, duplicates and late delivery', () => {
  const captions = new LiveTranscripts('test')
  const add = (
    delta: string,
    start_ms: number,
    type = 'session.input_transcript.delta',
    event_id = delta
  ) =>
    captions.append({
      type,
      delta,
      start_ms,
      end_ms: start_ms + 200,
      event_id,
    })!
  const user = add('Hello', 1000)
  const assistant = add('Yes', 1100, 'session.output_transcript.delta')
  expect(user.id).not.toBe(assistant.id)
  const later = add(' world', 1400)
  expect(later.id).toBe(user.id)
  expect(later.content).toBe('Hello world')
  expect(add(' world', 1400)).toBeNull()
  expect(add('Oh, ', 800).content).toBe('Oh, Hello world')
  expect(add('Next', 5000).id).not.toBe(user.id)
  expect(later.fragments).toHaveLength(2)
})
