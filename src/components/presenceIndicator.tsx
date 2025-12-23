/**
 * PresenceIndicator Component
 *
 * 現在の検知状態を視覚的に表示するインジケーター
 * Requirements: 5.1, 5.2
 */

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { PresenceState } from '@/features/presence/presenceTypes'
import { useTranslation } from 'react-i18next'

interface PresenceIndicatorProps {
  className?: string
}

/**
 * 状態に応じた色を取得
 */
const getStateColor = (state: PresenceState): string => {
  switch (state) {
    case 'idle':
      return 'bg-gray-400'
    case 'detected':
      return 'bg-green-500'
    case 'greeting':
      return 'bg-blue-500'
    case 'conversation-ready':
      return 'bg-green-500'
    default:
      return 'bg-gray-400'
  }
}

/**
 * 状態に応じたラベルキーを取得
 */
const getStateLabelKey = (state: PresenceState): string => {
  switch (state) {
    case 'idle':
      return 'PresenceStateIdle'
    case 'detected':
      return 'PresenceStateDetected'
    case 'greeting':
      return 'PresenceStateGreeting'
    case 'conversation-ready':
      return 'PresenceStateConversationReady'
    default:
      return 'PresenceStateIdle'
  }
}

const PresenceIndicator = ({ className = '' }: PresenceIndicatorProps) => {
  const { t } = useTranslation()
  const presenceDetectionEnabled = settingsStore(
    (s) => s.presenceDetectionEnabled
  )
  const presenceState = homeStore((s) => s.presenceState)

  // 人感検知が無効の場合は表示しない
  if (!presenceDetectionEnabled) {
    return null
  }

  const colorClass = getStateColor(presenceState)
  const shouldPulse = presenceState === 'detected'

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      title={t(getStateLabelKey(presenceState))}
    >
      <div
        data-testid="presence-indicator-dot"
        className={`w-3 h-3 rounded-full ${colorClass} ${shouldPulse ? 'animate-pulse' : ''}`}
      />
      <span className="text-xs text-gray-600">
        {t(getStateLabelKey(presenceState))}
      </span>
    </div>
  )
}

export default PresenceIndicator
