import { useTranslation } from 'react-i18next'

import { settingsFieldWidth } from '@/components/settings/formStyles'
import { ToggleSwitch } from '@/components/toggleSwitch'
import settingsStore from '@/features/stores/settings'
import {
  disableScreenLighting,
  enableScreenLighting,
} from '@/features/vrmViewer/screenLightingCapture'

interface ScreenLightingSettingsProps {
  enabled: boolean
  strength: number
}

export const ScreenLightingSettings = ({
  enabled,
  strength,
}: ScreenLightingSettingsProps) => {
  const { t } = useTranslation()

  const setEnabled = (nextEnabled: boolean) => {
    if (nextEnabled) {
      enableScreenLighting()
      return
    }

    disableScreenLighting()
  }

  return (
    <div className="my-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="text-xl font-bold">{t('ScreenLightingSync')}</div>
        <ToggleSwitch
          enabled={enabled}
          testId="screen-lighting-toggle"
          onChange={setEnabled}
        />
      </div>
      <div className="mb-4 text-sm">{t('ScreenLightingSyncDescription')}</div>
      {enabled && (
        <>
          <div className="font-bold">
            {t('ScreenLightingStrength')}: {strength.toFixed(1)}
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.1"
            value={strength}
            aria-label={t('ScreenLightingStrength')}
            data-testid="screen-lighting-strength"
            onChange={(event) =>
              settingsStore.setState({
                screenLightingStrength: parseFloat(event.target.value),
              })
            }
            className={`mt-2 mb-2 input-range ${settingsFieldWidth.full}`}
          />
          <div className="text-xs text-text2">
            {t('ScreenLightingCaptureHint')}
          </div>
        </>
      )}
    </div>
  )
}
