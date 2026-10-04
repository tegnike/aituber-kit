import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import settingsStore from '@/features/stores/settings'
import {
  CharacterModelSection,
  CharacterPositionSection,
  CharacterVrmExtrasSection,
  CharacterPromptSection,
} from './character/index'
import { settingsControlClass } from '@/components/settings/formStyles'

const Character = () => {
  const { t } = useTranslation()
  const {
    characterName,
    selectedVrmPath,
    selectedLive2DPath,
    selectedPNGTuberPath,
    pngTuberSensitivity,
    pngTuberChromaKeyEnabled,
    pngTuberChromaKeyColor,
    pngTuberChromaKeyTolerance,
    modelType,
    fixedCharacterPosition,
    selectAIService,
    systemPrompt,
    characterPreset1,
    characterPreset2,
    characterPreset3,
    characterPreset4,
    characterPreset5,
    customPresetName1,
    customPresetName2,
    customPresetName3,
    customPresetName4,
    customPresetName5,
    selectedPresetIndex,
    lightingIntensity,
    screenLightingEnabled,
    screenLightingStrength,
    poseAdjustMode,
    thinkingPoseEnabled,
    thinkingPoseId,
    poseConfigs,
  } = settingsStore()

  return (
    <>
      <div className="flex items-center mb-6">
        <Image
          src="/images/setting-icons/character-settings.svg"
          alt="Character Settings"
          width={24}
          height={24}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">{t('CharacterSettings')}</h2>
      </div>
      <div className="">
        <div className="mb-4 text-xl font-bold">{t('CharacterName')}</div>
        <input
          className={settingsControlClass.compact}
          type="text"
          placeholder={t('CharacterName')}
          value={characterName}
          onChange={(e) =>
            settingsStore.setState({ characterName: e.target.value })
          }
        />

        <CharacterModelSection
          modelType={modelType}
          selectedVrmPath={selectedVrmPath}
          selectedLive2DPath={selectedLive2DPath}
          selectedPNGTuberPath={selectedPNGTuberPath}
          pngTuberSensitivity={pngTuberSensitivity}
          pngTuberChromaKeyEnabled={pngTuberChromaKeyEnabled}
          pngTuberChromaKeyColor={pngTuberChromaKeyColor}
          pngTuberChromaKeyTolerance={pngTuberChromaKeyTolerance}
        />

        {/* Character Position Controls - VRM/Live2D only (PNGTuber uses scale/offset in viewer) */}
        {modelType !== 'pngtuber' && (
          <CharacterPositionSection
            modelType={modelType}
            fixedCharacterPosition={fixedCharacterPosition}
          />
        )}

        {modelType === 'vrm' && (
          <CharacterVrmExtrasSection
            lightingIntensity={lightingIntensity}
            screenLightingEnabled={screenLightingEnabled}
            screenLightingStrength={screenLightingStrength}
            poseAdjustMode={poseAdjustMode}
            thinkingPoseEnabled={thinkingPoseEnabled}
            thinkingPoseId={thinkingPoseId}
            poseConfigs={poseConfigs}
          />
        )}

        <CharacterPromptSection
          selectAIService={selectAIService}
          systemPrompt={systemPrompt}
          characterPreset1={characterPreset1}
          characterPreset2={characterPreset2}
          characterPreset3={characterPreset3}
          characterPreset4={characterPreset4}
          characterPreset5={characterPreset5}
          customPresetName1={customPresetName1}
          customPresetName2={customPresetName2}
          customPresetName3={customPresetName3}
          customPresetName4={customPresetName4}
          customPresetName5={customPresetName5}
          selectedPresetIndex={selectedPresetIndex}
        />
      </div>
    </>
  )
}
export default Character
