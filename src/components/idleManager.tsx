/**
 * IdleManager Component
 *
 * アイドルモード機能を管理し、設定に応じて自動発話を制御する
 * Requirements: 4.1, 5.3, 6.1
 */

import { useIdleMode } from '@/hooks/useIdleMode'
import { useTranslation } from 'react-i18next'

function IdleManager(): JSX.Element | null {
  const { t } = useTranslation()

  const { isIdleActive, idleState, secondsUntilNextSpeech } = useIdleMode({
    onIdleSpeechStart: (phrase) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[IdleManager] Idle speech started:', phrase.text)
      }
    },
    onIdleSpeechComplete: () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[IdleManager] Idle speech completed')
      }
    },
    onIdleSpeechInterrupted: () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[IdleManager] Idle speech interrupted')
      }
    },
  })

  // アイドルモードが無効の場合は何も表示しない
  if (!isIdleActive || idleState === 'disabled') {
    return null
  }

  const indicatorColor =
    idleState === 'speaking'
      ? 'bg-green-500'
      : idleState === 'waiting'
        ? 'bg-yellow-500'
        : 'bg-gray-400'

  const animation = idleState === 'speaking' ? 'animate-pulse' : ''

  return (
    <div
      data-testid="idle-indicator"
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm"
    >
      <div
        data-testid="idle-indicator-dot"
        className={`w-2.5 h-2.5 rounded-full ${indicatorColor} ${animation}`}
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
