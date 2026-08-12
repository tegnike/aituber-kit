import { generateMessageId } from '@/utils/messageUtils'
import { getFirstSpeechCommaMinChars, SpeechSegmenter } from './speechSegmenter'
import { NormalizedMessageLogWriter } from './messageLogWriter'
import { createSpeechDispatcher } from './speechDispatcher'
import { SegmenterEvent } from './types'
import settingsStore from '@/features/stores/settings'

const sentenceBoundaryMarks = (text: string) => {
  const marks: { mark: string; end: number }[] = []
  for (let index = 0; index < text.length; index += 1) {
    const mark = text[index]
    if (!mark) continue
    if ('、。．!?！？\n'.includes(mark)) {
      marks.push({ mark, end: index + 1 })
      continue
    }
    if (mark === '.' || mark === ',') {
      const previousIsDigit = /\d/.test(text[index - 1] ?? '')
      const nextIsDigit = /\d/.test(text[index + 1] ?? '')
      if (!(previousIsDigit && nextIsDigit)) {
        marks.push({ mark, end: index + 1 })
      }
    }
  }
  return marks
}

export const alignDisplayMessagesToSpeech = (
  speechMessages: string[],
  displayMessage: string
): string[] | null => {
  if (displayMessage === '') return speechMessages.map(() => '')

  const speechBoundaryGroups = speechMessages.map(sentenceBoundaryMarks)
  if (
    speechBoundaryGroups
      .slice(0, -1)
      .some((boundaries) => boundaries.length === 0)
  ) {
    return null
  }
  const speechMarks = speechBoundaryGroups.flat().map(({ mark }) => mark)
  const displayBoundaries = sentenceBoundaryMarks(displayMessage)
  if (
    speechMarks.length !== displayBoundaries.length ||
    speechMarks.some((mark, index) => mark !== displayBoundaries[index]?.mark)
  ) {
    return null
  }

  let displayStart = 0
  let boundaryIndex = 0
  return speechBoundaryGroups.map((boundaries, speechIndex) => {
    boundaryIndex += boundaries.length
    const isLast = speechIndex === speechBoundaryGroups.length - 1
    const displayEnd = isLast
      ? displayMessage.length
      : (displayBoundaries[boundaryIndex - 1]?.end ?? displayStart)
    const aligned = displayMessage.slice(displayStart, displayEnd).trim()
    displayStart = displayEnd
    return aligned
  })
}

/**
 * 受け取った完成テキストを処理し、発話させる。
 * WebSocketの direct_send / スライド自動再生の台本読みで使用される。
 *
 * ストリーミング応答と同じSpeechSegmenterを一括pushで使うため、
 * 文分割・タグ・コードブロックの意味論はprocessAIResponseと同一
 * （表示形式のみ現行の正規化フォーマットを踏襲。設計§5.1）。
 * chatProcessing管理・記憶保存・思考ポーズは行わない（現行踏襲）。
 */
export type SpeakMessageOptions = {
  speechSessionId?: string
  displayMessage?: string
}

export const speakMessageHandler = async (
  receivedMessage: string,
  speechSessionIdOrOptions?: string | SpeakMessageOptions
) => {
  const options =
    typeof speechSessionIdOrOptions === 'string'
      ? { speechSessionId: speechSessionIdOrOptions }
      : (speechSessionIdOrOptions ?? {})
  const sessionId = options.speechSessionId || generateMessageId()
  const writer = new NormalizedMessageLogWriter()
  const createSegmenter = () =>
    new SpeechSegmenter({
      firstSpeechCommaMinChars: getFirstSpeechCommaMinChars(
        settingsStore.getState().selectVoice
      ),
    })
  const speechSegmenter = createSegmenter()
  const normalizedDisplayMessage = options.displayMessage?.trim()
  const hasSeparateDisplayMessage =
    normalizedDisplayMessage !== undefined &&
    normalizedDisplayMessage !== receivedMessage
  const displaySpeechSegments: string[] = []
  const speechEvents: Extract<SegmenterEvent, { kind: 'speech' }>[] = []

  if (hasSeparateDisplayMessage) {
    const displaySegmenter = createSegmenter()
    const handleDisplayEvent = (event: SegmenterEvent) => {
      writer.handleEvent(event)
      if (event.kind === 'speech') displaySpeechSegments.push(event.text)
    }
    for (const event of displaySegmenter.push(normalizedDisplayMessage ?? '')) {
      handleDisplayEvent(event)
    }
    for (const event of displaySegmenter.flush()) {
      handleDisplayEvent(event)
    }
  }

  const collectSpeechEvent = (event: SegmenterEvent) => {
    if (!hasSeparateDisplayMessage) writer.handleEvent(event)
    if (event.kind === 'speech') speechEvents.push(event)
  }

  for (const event of speechSegmenter.push(receivedMessage)) {
    collectSpeechEvent(event)
  }
  for (const event of speechSegmenter.flush()) {
    collectSpeechEvent(event)
  }

  const alignedDisplayMessages = hasSeparateDisplayMessage
    ? alignDisplayMessagesToSpeech(
        speechEvents.map(({ text }) => text),
        normalizedDisplayMessage ?? ''
      )
    : undefined
  const dispatcher = createSpeechDispatcher(sessionId, {
    displayMessages: hasSeparateDisplayMessage
      ? (alignedDisplayMessages ?? displaySpeechSegments)
      : undefined,
    displayMessageFallback: hasSeparateDisplayMessage ? '' : undefined,
  })

  speechEvents.forEach((event) => dispatcher.dispatch(event))
  writer.finalize()
}
