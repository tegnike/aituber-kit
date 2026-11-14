import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { ApiKeyInput } from './ApiKeyInput'
import { MultiModalToggle } from './MultiModalToggle'
import { settingsControlClass } from '@/components/settings/formStyles'

interface OpperConfigProps {
  opperKey: string
  selectAIModel: string
  enableMultiModal: boolean
}

export const OpperConfig = ({
  opperKey,
  selectAIModel,
  enableMultiModal,
}: OpperConfigProps) => {
  const { t } = useTranslation()

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <ApiKeyInput
        label={t('OpperAPIKeyLabel', 'Opper API Key')}
        value={opperKey}
        onChange={(value) => settingsStore.setState({ opperKey: value })}
        linkUrl="https://platform.opper.ai"
        linkLabel={t('OpperDashboardLink', 'Opper')}
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
          placeholder="claude-sonnet-4-6"
        />
      </div>

      <MultiModalToggle
        enabled={enableMultiModal}
        onToggle={handleMultiModalToggle}
      />
    </>
  )
}
