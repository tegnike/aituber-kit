import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import settingsStore from '@/features/stores/settings'
import { useRestrictedMode } from '@/hooks/useRestrictedMode'
import { Link } from '../../link'
import speakers from '../../speakers.json'
import { getSpeakerUpdateErrorMessage } from './speakerUpdateError'
import { getVoicevoxSpeakersInBrowser } from '@/features/messages/voicevoxBrowserClient'
import type { VoicevoxConnectionMode } from '@/features/constants/settings'
import {
  settingsActionWidth,
  settingsControlClass,
} from '@/components/settings/formStyles'

interface VoicevoxSettingsProps {
  selectVoice: string
  voicevoxServerUrl: string
  voicevoxSpeaker: string
  voicevoxSpeed: number
  voicevoxPitch: number
  voicevoxIntonation: number
  voicevoxConnectionMode: VoicevoxConnectionMode
}

export const VoicevoxSettings = ({
  selectVoice,
  voicevoxServerUrl,
  voicevoxSpeaker,
  voicevoxSpeed,
  voicevoxPitch,
  voicevoxIntonation,
  voicevoxConnectionMode,
}: VoicevoxSettingsProps) => {
  const { t } = useTranslation()
  const { isRestrictedMode } = useRestrictedMode()
  const [speakers_voicevox, setSpeakers_voicevox] = useState<Array<any>>([])
  const [isUpdatingVoicevoxSpeakers, setIsUpdatingVoicevoxSpeakers] =
    useState<boolean>(false)
  const [voicevoxSpeakersUpdateError, setVoicevoxSpeakersUpdateError] =
    useState<string>('')

  // VOICEVOXの話者一覧を取得する関数
  const fetchVoicevoxSpeakers = async () => {
    try {
      const response = await fetch('/speakers.json')
      const data = await response.json()
      setSpeakers_voicevox(data)
    } catch (error) {
      logger.error('Failed to fetch VOICEVOX speakers:', error)
    }
  }

  // コンポーネントマウント時またはVOICEVOX選択時に話者一覧を取得
  useEffect(() => {
    if (selectVoice === 'voicevox') {
      fetchVoicevoxSpeakers()
    }
  }, [selectVoice])

  return (
    <>
      <div className="my-2 text-sm whitespace-pre-wrap">
        {t('VoiceVoxInfo')}
        <br />
        <Link
          url="https://voicevox.hiroshiba.jp/"
          label="https://voicevox.hiroshiba.jp/"
        />
      </div>
      <div className="mt-4 font-bold">{t('VoicevoxConnectionMode')}</div>
      <div className="mt-2">
        <select
          value={voicevoxConnectionMode}
          aria-label={t('VoicevoxConnectionMode')}
          onChange={(e) =>
            settingsStore.setState({
              voicevoxConnectionMode: e.target.value as VoicevoxConnectionMode,
            })
          }
          className={settingsControlClass.medium}
        >
          <option value="server">{t('VoicevoxConnectionModeServer')}</option>
          <option value="browser">{t('VoicevoxConnectionModeBrowser')}</option>
        </select>
        {voicevoxConnectionMode === 'browser' && (
          <p className="mt-2 text-sm whitespace-pre-wrap">
            {t('VoicevoxConnectionModeBrowserInfo')}
          </p>
        )}
      </div>
      <div className="mt-4 font-bold">{t('VoicevoxServerUrl')}</div>
      <div className="mt-2">
        <input
          className={settingsControlClass.long}
          type="text"
          placeholder="http://localhost:50021"
          value={voicevoxServerUrl}
          onChange={(e) =>
            settingsStore.setState({
              voicevoxServerUrl: e.target.value,
            })
          }
        />
      </div>
      <div className="mt-4 font-bold">{t('SpeakerSelection')}</div>
      <div className="space-y-3">
        <select
          value={voicevoxSpeaker}
          onChange={(e) =>
            settingsStore.setState({
              voicevoxSpeaker: e.target.value,
            })
          }
          className={settingsControlClass.medium}
        >
          <option value="">{t('Select')}</option>
          {(speakers_voicevox.length > 0 ? speakers_voicevox : speakers).map(
            (speaker) => (
              <option key={speaker.id} value={speaker.id}>
                {speaker.speaker}
              </option>
            )
          )}
        </select>

        <button
          onClick={async () => {
            setIsUpdatingVoicevoxSpeakers(true)
            setVoicevoxSpeakersUpdateError('')
            try {
              if (voicevoxConnectionMode === 'browser') {
                setSpeakers_voicevox(
                  await getVoicevoxSpeakersInBrowser(voicevoxServerUrl)
                )
              } else {
                const response = await fetch(
                  '/api/update-voicevox-speakers?serverUrl=' +
                    encodeURIComponent(voicevoxServerUrl),
                  { method: 'POST' }
                )
                if (response.ok) {
                  const updatedSpeakersResponse = await fetch(
                    `/speakers.json?ts=${Date.now()}`
                  )
                  const updatedSpeakers = await updatedSpeakersResponse.json()
                  setSpeakers_voicevox(updatedSpeakers)
                } else {
                  setVoicevoxSpeakersUpdateError(
                    await getSpeakerUpdateErrorMessage(response)
                  )
                }
              }
            } catch (error) {
              setVoicevoxSpeakersUpdateError(
                error instanceof Error ? error.message : t('NetworkError')
              )
            } finally {
              setIsUpdatingVoicevoxSpeakers(false)
            }
          }}
          disabled={
            isUpdatingVoicevoxSpeakers ||
            (isRestrictedMode && voicevoxConnectionMode === 'server')
          }
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
          {isUpdatingVoicevoxSpeakers ? t('Updating') : t('UpdateSpeakerList')}
        </button>
        {voicevoxSpeakersUpdateError && (
          <div className="mt-2 text-red-600 text-sm">
            {voicevoxSpeakersUpdateError}
          </div>
        )}
      </div>
      <div className="mt-6 font-bold">
        <div className="select-none">
          {t('VoicevoxSpeed')}: {voicevoxSpeed}
        </div>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.01}
          value={voicevoxSpeed}
          className="mt-2 mb-4 input-range"
          onChange={(e) => {
            settingsStore.setState({
              voicevoxSpeed: Number(e.target.value),
            })
          }}
        ></input>
        <div className="select-none">
          {t('VoicevoxPitch')}: {voicevoxPitch}
        </div>
        <input
          type="range"
          min={-0.15}
          max={0.15}
          step={0.01}
          value={voicevoxPitch}
          className="mt-2 mb-4 input-range"
          onChange={(e) => {
            settingsStore.setState({
              voicevoxPitch: Number(e.target.value),
            })
          }}
        ></input>
        <div className="select-none">
          {t('VoicevoxIntonation')}: {voicevoxIntonation}
        </div>
        <input
          type="range"
          min={0.0}
          max={2.0}
          step={0.01}
          value={voicevoxIntonation}
          className="mt-2 mb-4 input-range"
          onChange={(e) => {
            settingsStore.setState({
              voicevoxIntonation: Number(e.target.value),
            })
          }}
        ></input>
      </div>
    </>
  )
}
