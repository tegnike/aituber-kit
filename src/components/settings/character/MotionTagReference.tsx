import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PoseConfigItem } from '@/features/stores/settings'

const KNOWN_MOTION_DESCRIPTIONS: Record<string, { ja: string; en: string }> = {
  think: { ja: '考え中、悩んでいる', en: 'thinking, pondering' },
  cheer: { ja: '応援、喜び、やったー', en: 'cheering, joy' },
  cross: { ja: '拒否、ダメ、バツ', en: 'rejection, no' },
  mouth_cover: { ja: '驚き、口を覆う', en: 'surprise, covering mouth' },
  crossed_arms: { ja: '自信、不満、腕組み', en: 'confidence, arms crossed' },
  bow: { ja: 'お辞儀、感謝、謝罪', en: 'bow, gratitude, apology' },
  shrug: { ja: 'お手上げ、分からない', en: 'shrug, no idea' },
  shy: { ja: '照れ、恥ずかしい', en: 'shy, embarrassed' },
  wave: { ja: '手を振る、挨拶', en: 'waving, greeting' },
  clap: { ja: '拍手、称賛', en: 'clapping, applause' },
}

export const MotionTagReference = ({
  poseConfigs,
}: {
  poseConfigs: PoseConfigItem[]
}) => {
  const { i18n } = useTranslation()
  const [copied, setCopied] = useState(false)
  const isJa = i18n.language === 'ja'

  const motionList = poseConfigs
    .map((p) => {
      const desc = KNOWN_MOTION_DESCRIPTIONS[p.id]
      const label = desc ? (isJa ? desc.ja : desc.en) : p.id
      return isJa ? `- ${p.id}: ${label}` : `- ${p.id}: ${label}`
    })
    .join('\n')
  const tagFormat = '[motion:モーション名]'
  const fullText = isJa
    ? `モーションタグを使ってキャラクターにポーズを取らせることができます。\n利用可能なモーションとその意味は以下の通りです。\n${motionList}\n\nモーションタグの書式: ${tagFormat}\n感情タグと併用可能です。モーションは会話の内容に合った場面でのみ使い、毎回使う必要はありません。`
    : `You can use motion tags to make the character pose.\nAvailable motions:\n${motionList}\n\nMotion tag format: [motion:motionName]\nCan be combined with emotion tags. Use motions only when appropriate, not every time.`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="font-bold text-sm mb-2">
        {isJa ? 'モーションタグ' : 'Motion Tags'}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {isJa
          ? 'システムプロンプトに貼り付けると、AIがモーションを使えるようになります。'
          : 'Paste into the system prompt to enable AI-controlled motions.'}
      </div>
      <div
        onClick={handleCopy}
        className="px-3 py-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <code className="block text-xs break-all select-all whitespace-pre-wrap">
          {fullText}
        </code>
        <div className="text-right mt-1">
          <span className="text-xs text-gray-400">
            {copied
              ? isJa
                ? '✓ コピー済み'
                : '✓ copied'
              : isJa
                ? 'コピーする'
                : 'Copy'}
          </span>
        </div>
      </div>
    </div>
  )
}
