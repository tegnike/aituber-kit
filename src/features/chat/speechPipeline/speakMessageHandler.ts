import { generateMessageId } from '@/utils/messageUtils'
import { getFirstSpeechCommaMinChars, SpeechSegmenter } from './speechSegmenter'
import { NormalizedMessageLogWriter } from './messageLogWriter'
import { createSpeechDispatcher } from './speechDispatcher'
import { SegmenterEvent } from './types'
import settingsStore from '@/features/stores/settings'

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

  const dispatcher = createSpeechDispatcher(sessionId, {
    displayMessages: hasSeparateDisplayMessage
      ? displaySpeechSegments
      : undefined,
    displayMessageFallback: hasSeparateDisplayMessage ? '' : undefined,
  })

  const handleSpeechEvent = (event: SegmenterEvent) => {
    if (!hasSeparateDisplayMessage) writer.handleEvent(event)
    if (event.kind === 'speech') dispatcher.dispatch(event)
  }

  for (const event of speechSegmenter.push(receivedMessage)) {
    handleSpeechEvent(event)
  }
  for (const event of speechSegmenter.flush()) {
    handleSpeechEvent(event)
  }
  writer.finalize()
}
