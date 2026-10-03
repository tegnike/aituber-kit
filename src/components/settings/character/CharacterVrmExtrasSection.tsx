import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import settingsStore, { PoseConfigItem } from '@/features/stores/settings'
import { ToggleSwitch } from '../../toggleSwitch'
import { PoseConfigSettings } from './PoseConfigSettings'
import { ScreenLightingSettings } from './ScreenLightingSettings'
import { settingsControlClass } from '@/components/settings/formStyles'

interface CharacterVrmExtrasSectionProps {
  lightingIntensity: number
  screenLightingEnabled: boolean
  screenLightingStrength: number
  poseAdjustMode: boolean
  thinkingPoseEnabled: boolean
  thinkingPoseId: string
  poseConfigs: PoseConfigItem[]
}

export const CharacterVrmExtrasSection = ({
  lightingIntensity,
  screenLightingEnabled,
  screenLightingStrength,
  poseAdjustMode,
  thinkingPoseEnabled,
  thinkingPoseId,
  poseConfigs,
}: CharacterVrmExtrasSectionProps) => {
  const { t } = useTranslation()

  return (
    <>
      {/* VRM Lighting Controls */}
      <div className="my-6">
        <div className="text-xl font-bold mb-4">{t('LightingIntensity')}</div>
        <div className="mb-4">{t('LightingIntensityDescription')}</div>
        <div className="font-bold">
          {t('LightingIntensity')}: {lightingIntensity.toFixed(1)}
        </div>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={lightingIntensity}
          onChange={(e) => {
            const intensity = parseFloat(e.target.value)
            settingsStore.setState({ lightingIntensity: intensity })
            const { viewer } = homeStore.getState()
            if (
              viewer &&
              typeof viewer.updateLightingIntensity === 'function'
            ) {
              viewer.updateLightingIntensity(intensity)
            }
          }}
          className="mt-2 mb-4 input-range"
        />
      </div>

      <ScreenLightingSettings
        enabled={screenLightingEnabled}
        strength={screenLightingStrength}
      />

      <PoseConfigSettings />

      <div className="my-6">
        <div className="text-xl font-bold mb-4">{t('ThinkingPose')}</div>
        <div className="mb-4 text-sm">{t('ThinkingPoseDescription')}</div>
        <ToggleSwitch
          enabled={thinkingPoseEnabled}
          onChange={(v) => settingsStore.setState({ thinkingPoseEnabled: v })}
        />
        {thinkingPoseEnabled && (
          <div className="mt-4">
            <div className="text-sm font-bold mb-2">
              {t('ThinkingPoseSelect')}
            </div>
            <select
              className={settingsControlClass.medium}
              value={thinkingPoseId}
              onChange={(e) =>
                settingsStore.setState({ thinkingPoseId: e.target.value })
              }
            >
              {poseConfigs.map((pose) => (
                <option key={pose.id} value={pose.id}>
                  {pose.id}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="my-6">
        <div className="text-xl font-bold mb-4">{t('PoseAdjustMode')}</div>
        <div className="mb-4 text-sm">{t('PoseAdjustModeDescription')}</div>
        <ToggleSwitch
          enabled={poseAdjustMode}
          onChange={(v) => settingsStore.setState({ poseAdjustMode: v })}
        />
      </div>
    </>
  )
}
