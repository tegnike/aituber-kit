import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { ApiKeyInput } from './ApiKeyInput'
import { MultiModalToggle } from './MultiModalToggle'
import { settingsControlClass } from '@/components/settings/formStyles'

interface RuncrateConfigProps {
  runcrateKey: string
  selectAIModel: string
  enableMultiModal: boolean
}

export const RuncrateConfig = ({
  runcrateKey,
  selectAIModel,
  enableMultiModal,
}: RuncrateConfigProps) => {
  const { t } = useTranslation()

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <ApiKeyInput
        label={t('RuncrateAPIKeyLabel', 'Runcrate API Key')}
        value={runcrateKey}
        onChange={(value) => settingsStore.setState({ runcrateKey: value })}
        linkUrl="https://runcrate.ai/dashboard/api-keys"
        linkLabel={t('RuncrateDashboardLink', 'Runcrate Dashboard')}
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
          placeholder="deepseek-ai/DeepSeek-V4.1-Flash"
        />
      </div>

      <p className="my-2 text-sm whitespace-pre-wrap">
        {t(
          'RuncrateModelNameInstruction',
          'Enter a Runcrate model ID (e.g. "deepseek-ai/DeepSeek-V4.1-Flash", "zai-org/GLM-5.3"). You can find model IDs on the Runcrate models page.'
        )}
      </p>

      <MultiModalToggle
        enabled={enableMultiModal}
        onToggle={handleMultiModalToggle}
      />
    </>
  )
}
