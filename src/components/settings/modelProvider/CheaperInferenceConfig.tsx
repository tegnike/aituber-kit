import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { ApiKeyInput } from './ApiKeyInput'
import { MultiModalToggle } from './MultiModalToggle'
import { settingsControlClass } from '@/components/settings/formStyles'

interface CheaperInferenceConfigProps {
  cheaperinferenceKey: string
  selectAIModel: string
  enableMultiModal: boolean
}

export const CheaperInferenceConfig = ({
  cheaperinferenceKey,
  selectAIModel,
  enableMultiModal,
}: CheaperInferenceConfigProps) => {
  const { t } = useTranslation()

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <ApiKeyInput
        label={t('CheaperInferenceAPIKeyLabel', 'Cheaper Inference API Key')}
        value={cheaperinferenceKey}
        onChange={(value) =>
          settingsStore.setState({ cheaperinferenceKey: value })
        }
        linkUrl="https://cheaperinference.com/signup"
        linkLabel={t('CheaperInferenceDashboardLink', 'Cheaper Inference')}
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
          placeholder="gpt-5.4-mini"
        />
      </div>

      <MultiModalToggle
        enabled={enableMultiModal}
        onToggle={handleMultiModalToggle}
      />
    </>
  )
}
