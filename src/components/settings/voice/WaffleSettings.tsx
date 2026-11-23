import { useTranslation } from 'react-i18next'

import settingsStore from '@/features/stores/settings'
import { Link } from '../../link'
import { settingsControlClass } from '@/components/settings/formStyles'

interface WaffleSettingsProps {
  waffleApiKey: string
  waffleVoiceId: string
}

export const WaffleSettings = ({
  waffleApiKey,
  waffleVoiceId,
}: WaffleSettingsProps) => {
  const { t } = useTranslation()

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
          type="text"
          placeholder="awp_..."
          value={waffleApiKey}
          onChange={(e) =>
            settingsStore.setState({
              waffleApiKey: e.target.value,
            })
          }
        />
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
