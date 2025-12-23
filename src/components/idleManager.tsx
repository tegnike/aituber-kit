/**
 * IdleManager Component
 *
 * アイドルモード機能を管理し、設定に応じて自動発話を制御する
 * Requirements: 4.1, 5.3, 6.1
 */

import { useIdleMode } from '@/hooks/useIdleMode'
import settingsStore from '@/features/stores/settings'
import { useTranslation } from 'react-i18next'

const IdleManager = () => {
  const { t } = useTranslation()
  const idleModeEnabled = settingsStore((s) => s.idleModeEnabled)

  const { isIdleActive, idleState, secondsUntilNextSpeech } = useIdleMode({
    onIdleSpeechStart: (phrase) => {
      console.log('[IdleManager] Idle speech started:', phrase.text)
    },
    onIdleSpeechComplete: () => {
      console.log('[IdleManager] Idle speech completed')
    },
    onIdleSpeechInterrupted: () => {
      console.log('[IdleManager] Idle speech interrupted')
    },
  })

  // アイドルモードが無効の場合は何も表示しない
  if (!isIdleActive || idleState === 'disabled') {
    return null
  }

  // 状態に応じた色を取得
  const getIndicatorColor = () => {
    switch (idleState) {
      case 'speaking':
        return 'bg-green-500'
      case 'waiting':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  // 状態に応じたアニメーションを取得
  const getAnimation = () => {
    return idleState === 'speaking' ? 'animate-pulse' : ''
  }

  return (
    <div
      data-testid="idle-indicator"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm"
    >
      <div
        data-testid="idle-indicator-dot"
        className={`w-2.5 h-2.5 rounded-full ${getIndicatorColor()} ${getAnimation()}`}
      />
      <span className="text-xs text-white/90 font-medium">
        {idleState === 'speaking'
          ? t('Idle.Speaking')
          : t('Idle.WaitingPrefix')}
      </span>
      {idleState === 'waiting' && (
        <span
          data-testid="idle-countdown"
          className="text-xs text-white/70 tabular-nums"
        >
          {secondsUntilNextSpeech}s
        </span>
      )}
    </div>
  )
}

export default IdleManager
