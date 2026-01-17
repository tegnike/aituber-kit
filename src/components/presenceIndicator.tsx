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
 * 状態ごとの色とラベルキーのマッピング
 */
const STATE_CONFIG: Record<PresenceState, { color: string; labelKey: string }> =
  {
    idle: { color: 'bg-gray-400', labelKey: 'PresenceStateIdle' },
    detected: { color: 'bg-green-500', labelKey: 'PresenceStateDetected' },
    greeting: { color: 'bg-blue-500', labelKey: 'PresenceStateGreeting' },
    'conversation-ready': {
      color: 'bg-green-500',
      labelKey: 'PresenceStateConversationReady',
    },
  }

function getStateConfig(state: PresenceState): {
  color: string
  labelKey: string
} {
  return STATE_CONFIG[state] ?? STATE_CONFIG.idle
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

  const { color, labelKey } = getStateConfig(presenceState)
  const shouldPulse = presenceState === 'detected'

  return (
    <div className={`flex items-center gap-2 ${className}`} title={t(labelKey)}>
      <div
        data-testid="presence-indicator-dot"
        className={`w-3 h-3 rounded-full ${color} ${shouldPulse ? 'animate-pulse' : ''}`}
      />
      <span className="text-xs text-gray-600">{t(labelKey)}</span>
    </div>
  )
}

export default PresenceIndicator
