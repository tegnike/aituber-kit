import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import settingsStore from '@/features/stores/settings'
import type { WaffleVoice } from '@/pages/api/waffle-voices'
import { Link } from '../../link'
import { getSpeakerUpdateErrorMessage } from './speakerUpdateError'
import {
  settingsActionWidth,
  settingsControlClass,
} from '@/components/settings/formStyles'

interface WaffleSettingsProps {
  waffleApiKey: string
  waffleVoiceId: string
}

export const WaffleSettings = ({
  waffleApiKey,
  waffleVoiceId,
}: WaffleSettingsProps) => {
  const { t } = useTranslation()
  // 取得に使った API キーと一緒に持ち、キーが変わったら前のキーの一覧は使わない
  const [voiceList, setVoiceList] = useState<{
    apiKey: string
    voices: WaffleVoice[]
  }>({ apiKey: '', voices: [] })
  const [isUpdatingVoices, setIsUpdatingVoices] = useState(false)
  const [voicesUpdateError, setVoicesUpdateError] = useState('')
  const latestRequest = useRef(0)

  // ボイス一覧は API キーごとに異なるため、その都度 Waffle から取得する
  const updateVoices = useCallback(
    async (apiKey: string) => {
      const requestId = ++latestRequest.current
      setIsUpdatingVoices(true)
      setVoicesUpdateError('')
      try {
        const response = await fetch('/api/waffle-voices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey }),
        })
        if (requestId !== latestRequest.current) return
        if (response.ok) {
          const data = (await response.json()) as { voices?: WaffleVoice[] }
          if (requestId !== latestRequest.current) return
          setVoiceList({ apiKey, voices: data.voices ?? [] })
        } else {
          const message = await getSpeakerUpdateErrorMessage(response)
          if (requestId !== latestRequest.current) return
          setVoicesUpdateError(message)
        }
      } catch {
        if (requestId !== latestRequest.current) return
        setVoicesUpdateError(t('NetworkError'))
      } finally {
        if (requestId === latestRequest.current) setIsUpdatingVoices(false)
      }
    },
    [t]
  )

  // 設定を開いたとき、APIキーが入力済みなら一覧を取得しておく
  useEffect(() => {
    const { waffleApiKey: apiKey } = settingsStore.getState()
    if (apiKey.trim()) void updateVoices(apiKey)
  }, [updateVoices])

  const voices = voiceList.apiKey === waffleApiKey ? voiceList.voices : []
  const isListedVoice = voices.some(({ id }) => id === waffleVoiceId)

  return (
    <>
      <div className="my-2 text-sm whitespace-pre-wrap">
        {t('WaffleInfo')}
        <br />
        <Link url="https://aniwaffle.com" label="https://aniwaffle.com" />
        <br />
      </div>
      <div className="mt-4 font-bold">{t('WaffleApiKey')}</div>
      <div className="mt-2">
        <input
          className={settingsControlClass.long}
          type="password"
          placeholder="awp_..."
          value={waffleApiKey}
          onChange={(e) =>
            settingsStore.setState({
              waffleApiKey: e.target.value,
            })
          }
        />
      </div>
      <div className="mt-4 font-bold">{t('SpeakerSelection')}</div>
      <div className="mt-2 space-y-3">
        <select
          aria-label={t('SpeakerSelection')}
          value={waffleVoiceId}
          onChange={(e) =>
            settingsStore.setState({
              waffleVoiceId: e.target.value,
            })
          }
          className={settingsControlClass.medium}
        >
          <option value="">{t('Select')}</option>
          {voices.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
          {waffleVoiceId && !isListedVoice && (
            <option value={waffleVoiceId}>{waffleVoiceId}</option>
          )}
        </select>

        <button
          onClick={() => void updateVoices(waffleApiKey)}
          disabled={isUpdatingVoices}
          className={`${settingsActionWidth} flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-theme transition-colors duration-200 hover:bg-primary-hover active:bg-primary-press disabled:cursor-not-allowed disabled:bg-primary-disabled`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isUpdatingVoices ? t('Updating') : t('UpdateSpeakerList')}
        </button>
        {voicesUpdateError && (
          <div className="mt-2 text-red-600 text-sm">{voicesUpdateError}</div>
        )}
      </div>
      <div className="mt-4 font-bold">{t('WaffleVoiceId')}</div>
      <div className="my-2 text-sm whitespace-pre-wrap">
        {t('WaffleVoiceIdInfo')}
        <br />
        <Link
          url="https://aniwaffle.com/docs/voices"
          label="https://aniwaffle.com/docs/voices"
        />
        <br />
      </div>
      <div className="mt-2">
        <input
          className={settingsControlClass.medium}
          type="text"
          placeholder="builtin_voice_062"
          value={waffleVoiceId}
          onChange={(e) =>
            settingsStore.setState({
              waffleVoiceId: e.target.value,
            })
          }
        />
      </div>
    </>
  )
}
