import { useDemoMode } from '@/hooks/useDemoMode'
import { useTranslation } from 'react-i18next'

interface DemoModeNoticeProps {
  featureKey?: string
}

/**
 * デモモード時に機能制限を通知するコンポーネント
 * デモモードでない場合はnullを返却
 */
export function DemoModeNotice({ featureKey }: DemoModeNoticeProps) {
  const { isDemoMode } = useDemoMode()
  const { t } = useTranslation()

  if (!isDemoMode) {
    return null
  }

  return <div className="text-gray-500 text-sm mt-1">{t('DemoModeNotice')}</div>
}
