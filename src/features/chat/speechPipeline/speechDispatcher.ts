import homeStore from '@/features/stores/home'
import { speakCharacter } from '@/features/messages/speakCharacter'
import { SpeakQueue } from '@/features/messages/speakQueue'
import { EmotionType } from '@/features/messages/messages'
import { isSpeakableText } from './tagExtractors'
import { SpeechEvent } from './types'

/**
 * 最新の応答セッションID。
 * チャット/スライド由来の応答セッション（processAIResponse / speakMessageHandler）
 * のみが登録する。新しい応答が始まると、古い応答のdispatcherは自主的に沈黙する
 * （設計§5.2 ガード1 / C7: セッションピンポンの解消）。
 */
let latestResponseSessionId: string | null = null

/** テスト用: モジュール状態のリセット */
export const __resetLatestResponseSessionId = () => {
  latestResponseSessionId = null
}

export type SpeechDispatcher = {
  /** 発話を依頼したらtrue（停止・調停・記号のみ等で見送ったらfalse） */
  dispatch: (event: SpeechEvent) => boolean
  /** この応答で一度でも発話を依頼したか（思考ポーズのリセット判定用） */
  readonly anyDispatched: boolean
  /** 停止または新応答への交代で無効化されたか（finalize判定用） */
  readonly disabled: boolean
}

export type SpeechDispatcherOptions = {
  displayMessages?: string[]
}

/**
 * 応答セッション1回分の発話ディスパッチャ。
 *
 * キャンセレーション意味論（設計§5.2 / §6）:
 * - 停止トークンは初回dispatch時に遅延捕捉する（モデル応答待ち中の停止で
 *   未発話の新応答が巻き添えにならないため）
 * - トークン変化を検知したら、停止スコープが 'all' または自セッションなら無効化、
 *   他セッション向けならトークンを追従して発話を継続する
 * - 自分より新しい応答セッションが登録されたら無効化
 */
export const createSpeechDispatcher = (
  sessionId: string,
  options: SpeechDispatcherOptions = {}
): SpeechDispatcher => {
  latestResponseSessionId = sessionId
  let capturedToken: number | null = null
  let disabled = false
  let anyDispatched = false
  // スライド字幕はこの応答の発話中文リストで全置換する（旧refベース実装の踏襲）
  const slideMessages: string[] = []
  let displayMessageIndex = 0

  const dispatch = (event: SpeechEvent): boolean => {
    if (disabled) return false

    // ガード1: セッションアービトレーション
    if (latestResponseSessionId !== sessionId) {
      disabled = true
      return false
    }

    // ガード2: 停止トークン（遅延捕捉）
    if (capturedToken === null) {
      capturedToken = SpeakQueue.currentStopToken
    } else if (SpeakQueue.currentStopToken !== capturedToken) {
      const scope = SpeakQueue.currentStopScope
      if (scope === 'all' || scope === sessionId) {
        disabled = true
        return false
      }
      // 他セッション向けの停止 → 追従して継続
      capturedToken = SpeakQueue.currentStopToken
    }

    // ガード3: 発話可否（記号・空白のみは発話しない）
    if (!isSpeakableText(event.text)) return false

    const displayMessage = options.displayMessages?.[displayMessageIndex]
    displayMessageIndex += 1
    speakOne(sessionId, event, slideMessages, displayMessage)
    anyDispatched = true
    return true
  }

  return {
    dispatch,
    get anyDispatched() {
      return anyDispatched
    },
    get disabled() {
      return disabled
    },
  }
}

// スライド字幕・chatProcessingCount連動を含む発話依頼
// （旧handlers.tsのhandleSpeakAndStateUpdateの移設。挙動不変）
const speakOne = (
  sessionId: string,
  event: SpeechEvent,
  slideMessages: string[],
  displayMessage: string | undefined
) => {
  const hs = homeStore.getState()
  const emotion = event.emotionTag.includes('[')
    ? (event.emotionTag.slice(1, -1).toLowerCase() as EmotionType)
    : 'neutral'

  const talk = {
    message: event.text,
    emotion,
    motion: event.motionTag || undefined,
  }
  const onStart = () => {
    hs.incrementChatProcessingCount()
    slideMessages.push(displayMessage ?? event.text)
    homeStore.setState({ slideMessages: [...slideMessages] })
  }
  const onComplete = () => {
    hs.decrementChatProcessingCount()
    slideMessages.shift()
    homeStore.setState({ slideMessages: [...slideMessages] })
  }

  if (displayMessage !== undefined) {
    speakCharacter(sessionId, talk, onStart, onComplete, displayMessage)
  } else {
    speakCharacter(sessionId, talk, onStart, onComplete)
  }
}
