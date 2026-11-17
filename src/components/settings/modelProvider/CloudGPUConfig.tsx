import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { ApiKeyInput } from './ApiKeyInput'
import { MultiModalToggle } from './MultiModalToggle'
import { settingsControlClass } from '@/components/settings/formStyles'

interface CloudGPUConfigProps {
  cloudgpuKey: string
  selectAIModel: string
  enableMultiModal: boolean
}

export const CloudGPUConfig = ({
  cloudgpuKey,
  selectAIModel,
  enableMultiModal,
}: CloudGPUConfigProps) => {
  const { t } = useTranslation()

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <ApiKeyInput
        label={t('CloudGPUAPIKeyLabel', 'CloudGPU API Key')}
        value={cloudgpuKey}
        onChange={(value) => settingsStore.setState({ cloudgpuKey: value })}
        linkUrl="https://cloudgpu.app"
        linkLabel={t('CloudGPUSiteLink', 'cloudgpu.app')}
      />

      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('SelectModel')}</div>
        <input
          className={settingsControlClass.medium}
          type="text"
          value={selectAIModel}
          onChange={(e) =>
            settingsStore.setState({ selectAIModel: e.target.value })
          }
          placeholder="deepseek-v4-flash"
        />
      </div>

      <p className="my-2 text-sm whitespace-pre-wrap">
        {t(
          'CloudGPUModelNameInstruction',
          'Enter a model ID from CloudGPU (e.g. "deepseek-v4-flash", "glm-5.3"). https://cloudgpu.app/v1/models lists the model IDs.'
        )}
      </p>

      <MultiModalToggle
        enabled={enableMultiModal}
        onToggle={handleMultiModalToggle}
      />
    </>
  )
}
