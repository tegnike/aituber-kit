/**
 * KioskSettings Component
 *
 * デモ端末モード機能の設定UIを提供
 * Requirements: 1.1, 1.2, 3.4, 6.3, 7.1, 7.3
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { ToggleSwitch } from '../toggleSwitch'
import {
  clampKioskMaxInputLength,
  parseNgWords,
  KIOSK_MAX_INPUT_LENGTH_MIN,
  KIOSK_MAX_INPUT_LENGTH_MAX,
} from '@/features/kiosk/kioskTypes'

const KioskSettings = () => {
  const { t } = useTranslation()

  // Settings store state
  const kioskModeEnabled = settingsStore((s) => s.kioskModeEnabled)
  const kioskPasscode = settingsStore((s) => s.kioskPasscode)
  const kioskMaxInputLength = settingsStore((s) => s.kioskMaxInputLength)
  const kioskNgWords = settingsStore((s) => s.kioskNgWords)
  const kioskNgWordEnabled = settingsStore((s) => s.kioskNgWordEnabled)

  // Local state for NG words input
  const [ngWordsInput, setNgWordsInput] = useState('')

  // Sync NG words from store to local state
  useEffect(() => {
    setNgWordsInput(kioskNgWords.join(', '))
  }, [kioskNgWords])

  // Handlers
  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    settingsStore.setState({ kioskPasscode: e.target.value })
  }

  const handleMaxInputLengthChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value > 0) {
      settingsStore.setState({ kioskMaxInputLength: value })
    } else if (e.target.value === '') {
      // Handle empty input by resetting to minimum value
      settingsStore.setState({
        kioskMaxInputLength: KIOSK_MAX_INPUT_LENGTH_MIN,
      })
    }
  }

  const handleMaxInputLengthBlur = () => {
    settingsStore.setState({
      kioskMaxInputLength: clampKioskMaxInputLength(kioskMaxInputLength),
    })
  }

  const handleNgWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNgWordsInput(e.target.value)
  }

  const handleNgWordsBlur = () => {
    settingsStore.setState({ kioskNgWords: parseNgWords(ngWordsInput) })
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
          <h2 className="text-2xl font-bold">{t('KioskSettings')}</h2>
        </div>

        {/* デモ端末モードON/OFF */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('KioskModeEnabled')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('KioskModeEnabledInfo')}
          </div>
          <div className="my-2">
            <ToggleSwitch
              enabled={kioskModeEnabled}
              onChange={(v) => settingsStore.setState({ kioskModeEnabled: v })}
            />
          </div>
        </div>

        {/* パスコード設定 */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">{t('KioskPasscode')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('KioskPasscodeInfo')}
          </div>
          <div className="my-2 text-xs text-gray-500">
            {t('KioskPasscodeValidation')}
          </div>
          <div className="my-4">
            <input
              type="text"
              value={kioskPasscode}
              onChange={handlePasscodeChange}
              aria-label={t('KioskPasscode')}
              className="w-48 px-4 py-2 bg-white border border-gray-300 rounded-lg font-mono"
              autoComplete="off"
            />
          </div>
        </div>

        {/* 最大入力文字数設定 */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('KioskMaxInputLength')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('KioskMaxInputLengthInfo', {
              min: KIOSK_MAX_INPUT_LENGTH_MIN,
              max: KIOSK_MAX_INPUT_LENGTH_MAX,
            })}
          </div>
          <div className="my-4 flex items-center gap-2">
            <input
              type="number"
              min={KIOSK_MAX_INPUT_LENGTH_MIN}
              max={KIOSK_MAX_INPUT_LENGTH_MAX}
              value={kioskMaxInputLength}
              onChange={handleMaxInputLengthChange}
              onBlur={handleMaxInputLengthBlur}
              aria-label={t('KioskMaxInputLength')}
              className="w-24 px-4 py-2 bg-white border border-gray-300 rounded-lg"
            />
            <span>{t('Characters')}</span>
          </div>
        </div>

        {/* NGワードフィルター */}
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('KioskNgWordEnabled')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('KioskNgWordEnabledInfo')}
          </div>
          <div className="my-2">
            <ToggleSwitch
              enabled={kioskNgWordEnabled}
              onChange={(v) =>
                settingsStore.setState({ kioskNgWordEnabled: v })
              }
            />
          </div>

          {kioskNgWordEnabled && (
            <div className="my-4">
              <div className="my-2 text-sm font-medium">
                {t('KioskNgWords')}
              </div>
              <div className="my-2 text-xs text-gray-500">
                {t('KioskNgWordsInfo')}
              </div>
              <textarea
                value={ngWordsInput}
                onChange={handleNgWordsChange}
                onBlur={handleNgWordsBlur}
                className="w-full h-24 px-4 py-2 bg-white border border-gray-300 rounded-lg resize-none"
                aria-label={t('KioskNgWords')}
                placeholder={t('KioskNgWordsPlaceholder')}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default KioskSettings
