import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { ToggleSwitch } from '../../toggleSwitch'

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
    const { screenLightingCaptureOwned } = menuStore.getState()
    const { captureStatus } = homeStore.getState()

    if (nextEnabled) {
      settingsStore.setState({
        screenLightingEnabled: true,
        ...(captureStatus
          ? {}
          : {
              hideVideoDisplay: false,
              useVideoAsBackground: false,
            }),
      })
      menuStore.setState({
        showCapture: true,
        showWebcam: false,
        screenLightingCaptureOwned: !captureStatus,
      })
      homeStore.setState({ webcamStatus: false })
      return
    }

    settingsStore.setState({
      screenLightingEnabled: false,
      ...(screenLightingCaptureOwned
        ? {
            hideVideoDisplay: false,
            useVideoAsBackground: false,
          }
        : {}),
    })
    menuStore.setState(
      screenLightingCaptureOwned
        ? {
            showCapture: false,
            screenLightingCaptureOwned: false,
          }
        : { screenLightingCaptureOwned: false }
    )
    homeStore.getState().viewer.resetScreenLighting()
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
            data-testid="screen-lighting-strength"
            onChange={(event) =>
              settingsStore.setState({
                screenLightingStrength: parseFloat(event.target.value),
              })
            }
            className="mt-2 mb-2 input-range"
          />
          <div className="text-xs text-text2">
            {t('ScreenLightingCaptureHint')}
          </div>
        </>
      )}
    </div>
  )
}
