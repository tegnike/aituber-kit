import { EmotionType, Talk } from './messages'
import { synthesizeVoiceApi } from './synthesizeVoiceApi'

// Waffle が受け付ける音タグ（[laughing] など）。これ以外の [..] / <..> は
// Waffle API が 400 で拒否するため、送信前に取り除く。
const WAFFLE_SOUND_TAGS = new Set([
  'sighing',
  'gasping',
  'panting',
  'sniffing',
  'laughing',
  'groaning',
  'crying',
  'coughing',
])

// AITuberKit の感情を Waffle の感情タグに対応付ける（neutral / relaxed はタグなし）
const WAFFLE_EMOTION_TAGS: Partial<Record<EmotionType, string>> = {
  happy: 'happy',
  angry: 'angry',
  sad: 'sad',
  surprised: 'surprised',
}

export function toWaffleText(talk: Talk): string {
  const text = talk.message
    .replace(/<\/?[a-z][a-z:_-]*>/gi, '')
    .replace(/\[([^[\]]*)\]/g, (_, name: string) => {
      const tag = name.trim().toLowerCase()
      return WAFFLE_SOUND_TAGS.has(tag) ? `[${tag}]` : ''
    })
    .trim()
  const emotion = WAFFLE_EMOTION_TAGS[talk.emotion]
  return emotion && text ? `<${emotion}>${text}</${emotion}>` : text
}

export async function synthesizeVoiceWaffleApi(
  talk: Talk,
  apiKey: string,
  voiceId: string
): Promise<ArrayBuffer | null> {
  // APIキーとボイスIDが空でもそのまま送る。サーバー側が環境変数
  // （ANIWAFFLE_API_KEY / ANIWAFFLE_VOICE_ID）や内蔵ボイスで補う。
  const text = toWaffleText(talk)
  // 「[笑]」だけの文などは読み上げる内容がないので無音にする
  if (!text) return null

  return synthesizeVoiceApi(
    '/api/tts-waffle',
    { message: text, apiKey, voiceId },
    'Waffle',
    {
      buildErrorMessage: async (res) => {
        const errorText = await res
          .text()
          .catch(() => 'エラー詳細を取得できませんでした')
        return `Waffle APIからの応答が異常です。ステータスコード: ${res.status}, エラー詳細: ${errorText}`
      },
    }
  )
}
