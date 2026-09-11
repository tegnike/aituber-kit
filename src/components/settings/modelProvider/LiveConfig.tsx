import { isDemoMode } from '@/utils/demoMode'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import {
  liveVoices,
  liveVoicePresentation,
  type LiveVoice,
} from '@/features/live/config'
import { ToggleSwitch } from '@/components/toggleSwitch'
import { settingsControlClass } from '@/components/settings/formStyles'

export const LiveConfig = () => {
  const { t } = useTranslation()
  const enabled = settingsStore((s) => s.liveMode)
  const voice = settingsStore((s) => s.liveVoice)
  const backend = settingsStore((s) => s.liveBackendModel)
  const webSearch = settingsStore((s) => s.liveWebSearch)
  if (isDemoMode()) return null
  return (
    <div className="my-6">
      <div className="my-4 text-xl font-bold">GPT-Live-1</div>
      <p className="my-2">{t('Live.Description')}</p>
      <ToggleSwitch
        enabled={enabled}
        onChange={(liveMode) => settingsStore.setState({ liveMode })}
        testId="live-mode-toggle"
      />
      {enabled && (
        <>
          <p className="my-2">{t('Live.SettingsHint')}</p>
          <p className="my-2">{t('Live.PromptHint')}</p>
          <label className="my-4 block">
            <span className="mb-2 block font-bold">{t('Live.Voice')}</span>
            <select
              aria-label={t('Live.Voice')}
              className={settingsControlClass.compact}
              value={voice}
              onChange={(e) =>
                settingsStore.setState({
                  liveVoice: e.target.value as LiveVoice,
                })
              }
            >
              {liveVoices.map((v) => (
                <option key={v} value={v}>
                  {v}（{t(`Live.VoicePresentation.${liveVoicePresentation[v]}`)}
                  ）
                </option>
              ))}
            </select>
          </label>
          <label className="my-4 block">
            <span className="mb-2 block font-bold">{t('Live.Backend')}</span>
            <input
              className={settingsControlClass.medium}
              value={backend}
              maxLength={128}
              onChange={(e) =>
                settingsStore.setState({ liveBackendModel: e.target.value })
              }
            />
          </label>
          <div className="my-4 font-bold">{t('Live.WebSearch')}</div>
          <ToggleSwitch
            enabled={webSearch}
            onChange={(liveWebSearch) =>
              settingsStore.setState({ liveWebSearch })
            }
            testId="live-web-search-toggle"
          />
        </>
      )}
    </div>
  )
}
