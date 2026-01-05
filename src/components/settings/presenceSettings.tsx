/**
 * PresenceSettings Component
 *
 * 人感検知機能の設定UIを提供
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.4
 */

import { useTranslation } from 'react-i18next'
import settingsStore, {
  PresenceDetectionSensitivity,
} from '@/features/stores/settings'
import { TextButton } from '../textButton'

const PresenceSettings = () => {
  const { t } = useTranslation()

  // Settings store state
  const presenceDetectionEnabled = settingsStore(
    (s) => s.presenceDetectionEnabled
  )
  const presenceGreetingMessage = settingsStore(
    (s) => s.presenceGreetingMessage
  )
  const presenceDepartureTimeout = settingsStore(
    (s) => s.presenceDepartureTimeout
  )
  const presenceCooldownTime = settingsStore((s) => s.presenceCooldownTime)
  const presenceDetectionSensitivity = settingsStore(
    (s) => s.presenceDetectionSensitivity
  )
  const presenceDebugMode = settingsStore((s) => s.presenceDebugMode)

  // Handlers
  const handleToggleEnabled = () => {
    settingsStore.setState((s) => ({
      presenceDetectionEnabled: !s.presenceDetectionEnabled,
    }))
  }

  const handleGreetingMessageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    settingsStore.setState({ presenceGreetingMessage: e.target.value })
  }

  const handleDepartureTimeoutChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      settingsStore.setState({ presenceDepartureTimeout: value })
    }
  }

  const handleCooldownTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      settingsStore.setState({ presenceCooldownTime: value })
    }
  }

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    settingsStore.setState({
      presenceDetectionSensitivity: e.target
        .value as PresenceDetectionSensitivity,
    })
  }

  const handleToggleDebugMode = () => {
    settingsStore.setState((s) => ({
      presenceDebugMode: !s.presenceDebugMode,
    }))
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <div
            className="w-6 h-6 mr-2 icon-mask-default"
            style={{
              maskImage: 'url(/images/setting-icons/other-settings.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
          />
          <h2 className="text-2xl font-bold">{t('PresenceSettings')}</h2>
        </div>

        {/* 人感検知モードON/OFF */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceDetectionEnabled')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceDetectionEnabledInfo')}
          </div>
          <div className="my-2">
            <TextButton onClick={handleToggleEnabled}>
              {presenceDetectionEnabled ? t('StatusOn') : t('StatusOff')}
            </TextButton>
          </div>
        </div>

        {/* 挨拶メッセージ */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceGreetingMessage')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceGreetingMessageInfo')}
          </div>
          <div className="my-4">
            <textarea
              value={presenceGreetingMessage}
              onChange={handleGreetingMessageChange}
              className="w-full h-24 px-4 py-2 bg-white border border-gray-300 rounded-lg resize-none"
              placeholder={t('PresenceGreetingMessagePlaceholder')}
            />
          </div>
        </div>

        {/* 離脱判定時間 */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceDepartureTimeout')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceDepartureTimeoutInfo')}
          </div>
          <div className="my-4 flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="10"
              value={presenceDepartureTimeout}
              onChange={handleDepartureTimeoutChange}
              aria-label={t('PresenceDepartureTimeout')}
              className="w-20 px-4 py-2 bg-white border border-gray-300 rounded-lg"
            />
            <span>{t('Seconds')}</span>
          </div>
        </div>

        {/* クールダウン時間 */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceCooldownTime')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceCooldownTimeInfo')}
          </div>
          <div className="my-4 flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="30"
              value={presenceCooldownTime}
              onChange={handleCooldownTimeChange}
              aria-label={t('PresenceCooldownTime')}
              className="w-20 px-4 py-2 bg-white border border-gray-300 rounded-lg"
            />
            <span>{t('Seconds')}</span>
          </div>
        </div>

        {/* 検出感度 */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('PresenceDetectionSensitivity')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceDetectionSensitivityInfo')}
          </div>
          <div className="my-4">
            <select
              value={presenceDetectionSensitivity}
              onChange={handleSensitivityChange}
              aria-label={t('PresenceDetectionSensitivity')}
              className="w-40 px-4 py-2 bg-white border border-gray-300 rounded-lg"
            >
              <option value="low">{t('PresenceSensitivityLow')}</option>
              <option value="medium">{t('PresenceSensitivityMedium')}</option>
              <option value="high">{t('PresenceSensitivityHigh')}</option>
            </select>
          </div>
        </div>

        {/* デバッグモード */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('PresenceDebugMode')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PresenceDebugModeInfo')}
          </div>
          <div className="my-2">
            <TextButton onClick={handleToggleDebugMode}>
              {presenceDebugMode ? t('StatusOn') : t('StatusOff')}
            </TextButton>
          </div>
        </div>
      </div>
    </>
  )
}

export default PresenceSettings
