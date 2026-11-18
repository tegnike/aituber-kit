import type { Host, Player } from '@livliv-dev/player'
import { LipSync } from '@/features/lipSync/lipSync'
import type { CharacterRenderer } from '@/features/messages/characterRenderer'
import type { EmotionType } from '@/features/messages/messages'
import homeStore from '@/features/stores/home'

/**
 * AITuberKit の感情タグを LivLiv の標準表情 id へ対応づける。
 * 標準 id はどのモデルでも同じ意味を持つ。happy と relaxed は標準 id にないため、
 * happy は smile に寄せ、relaxed は neutral のままにする。
 */
const EXPRESSION_IDS: Partial<Record<EmotionType, string>> = {
  happy: 'smile',
  angry: 'angry',
  sad: 'sad',
  surprised: 'surprised',
}

export function expressionIdForEmotion(
  emotion: EmotionType,
  availableIds: readonly string[]
): string | null {
  const id = EXPRESSION_IDS[emotion]
  return id && availableIds.includes(id) ? id : null
}

let lipSync: LipSync | undefined
let emotion: EmotionType = 'neutral'

// VRM と同じく、最初の発話で作った LipSync をページの間使い続ける。
// 発話はキャンバスやモデルの読み込み中、WebGL 2 のないブラウザでも続く。
function getLipSync(): LipSync {
  lipSync ??= new LipSync(new AudioContext(), { forceStart: true })
  return lipSync
}

export function applyLivLivExpression(
  player: Pick<
    Player,
    'expressions' | 'setExpression'
  > | null = homeStore.getState().livlivPlayer
) {
  if (!player) return
  const ids = player.expressions.map(({ id }) => id)
  player.setExpression(expressionIdForEmotion(emotion, ids))
}

function setEmotion(next: EmotionType) {
  emotion = next
  applyLivLivExpression()
}

/**
 * 発話の音量を毎フレーム mouthOpen へ書く。Player の lip sync と同じ order（10）。
 * player.params.mouthOpen（GPT-Live の音声など）が大きいときはそちらを残す。
 */
export function bindLivLivMouth(
  player: Pick<Host, 'use'>,
  readVolume: () => number = () => lipSync?.update().volume ?? 0
): () => void {
  return player.use({
    order: 10,
    update(frame) {
      const volume = readVolume()
      const speech = Number.isFinite(volume) ? Math.min(1, volume) : 0
      frame.params.mouthOpen = Math.max(frame.params.mouthOpen, speech, 0)
    },
  })
}

export const livlivRenderer: CharacterRenderer = {
  async speak(buffer, talk, isNeedDecode, observer) {
    const audio = getLipSync()
    setEmotion(talk.emotion)
    await new Promise<void>((resolve, reject) => {
      audio
        .playFromArrayBuffer(
          buffer,
          resolve,
          isNeedDecode,
          24000,
          observer?.onPlaybackStart
        )
        .catch(reject)
    })
  },
  async speakPcm16Stream(stream, talk, sampleRate, observer) {
    const audio = getLipSync()
    setEmotion(talk.emotion)
    await audio.playPcm16Stream(
      stream,
      undefined,
      sampleRate,
      observer?.onPlaybackStart
    )
  },
  stopSpeaking() {
    lipSync?.stopCurrentPlayback()
  },
  resetToIdle() {
    setEmotion('neutral')
  },
}
