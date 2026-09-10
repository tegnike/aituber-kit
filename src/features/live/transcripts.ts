import type { LiveEvent } from './session'

export interface LiveFragment {
  delta: string
  start_ms: number
  end_ms: number
}
export interface LiveCaption {
  id: string
  role: 'user' | 'assistant'
  content: string
  fragments: LiveFragment[]
}

// Display grouping only: gaps never trigger model calls or terminate a turn.
export class LiveTranscripts {
  private rows: LiveCaption[] = []
  private seen = new Set<string>()
  constructor(private prefix: string) {}
  append(event: LiveEvent): LiveCaption | null {
    if (
      ![
        'session.input_transcript.delta',
        'session.output_transcript.delta',
      ].includes(event.type) ||
      typeof event.delta !== 'string' ||
      typeof event.start_ms !== 'number' ||
      typeof event.end_ms !== 'number'
    )
      return null
    if (event.event_id && this.seen.has(event.event_id)) return null
    if (event.event_id) this.seen.add(event.event_id)
    const role =
      event.type === 'session.input_transcript.delta' ? 'user' : 'assistant'
    let row = this.rows.find(
      (item) =>
        item.role === role &&
        item.fragments.some(
          (f) =>
            event.start_ms! <= f.end_ms + 1500 &&
            event.end_ms! >= f.start_ms - 1500
        )
    )
    if (!row) {
      row = {
        id: `${this.prefix}-${this.rows.length}`,
        role,
        content: '',
        fragments: [],
      }
      this.rows.push(row)
    }
    row.fragments.push({
      delta: event.delta,
      start_ms: event.start_ms,
      end_ms: event.end_ms,
    })
    row.fragments.sort((a, b) => a.start_ms - b.start_ms)
    row.content = row.fragments.map((f) => f.delta).join('')
    return { ...row, fragments: [...row.fragments] }
  }
}
