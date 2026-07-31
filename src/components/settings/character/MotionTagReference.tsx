import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PoseConfigItem } from '@/features/stores/settings'

const KNOWN_MOTION_IDS = new Set([
  'think',
  'cheer',
  'cross',
  'mouth_cover',
  'crossed_arms',
  'bow',
  'shrug',
  'shy',
  'wave',
  'clap',
])

const getMotionDescriptionKey = (motionId: string) => {
  return `MotionTagReference.Descriptions.${motionId}`
}

export const MotionTagReference = ({
  poseConfigs,
}: {
  poseConfigs: PoseConfigItem[]
}) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const motionList = poseConfigs
    .map((p) => {
      const label = KNOWN_MOTION_IDS.has(p.id)
        ? t(getMotionDescriptionKey(p.id))
        : p.id
      return `- ${p.id}: ${label}`
    })
    .join('\n')
  const tagFormat = '[motion:motionName]'
  const fullText = `${t('MotionTagReference.PromptIntroduction')}\n${t(
    'MotionTagReference.AvailableMotions'
  )}\n${motionList}\n\n${t('MotionTagReference.Format', {
    format: tagFormat,
  })}\n${t('MotionTagReference.Usage')}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="font-bold text-sm mb-2">
        {t('MotionTagReference.Title')}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {t('MotionTagReference.Description')}
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
              ? `✓ ${t('MotionTagReference.Copied')}`
              : t('MotionTagReference.Copy')}
          </span>
        </div>
      </div>
    </div>
  )
}
