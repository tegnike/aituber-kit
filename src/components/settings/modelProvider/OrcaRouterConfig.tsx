import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { ApiKeyInput } from './ApiKeyInput'
import { MultiModalToggle } from './MultiModalToggle'
import { settingsControlClass } from '@/components/settings/formStyles'

interface OrcaRouterConfigProps {
  orcarouterKey: string
  selectAIModel: string
  enableMultiModal: boolean
}

export const OrcaRouterConfig = ({
  orcarouterKey,
  selectAIModel,
  enableMultiModal,
}: OrcaRouterConfigProps) => {
  const { t } = useTranslation()

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <ApiKeyInput
        label={t('OrcaRouterAPIKeyLabel', 'OrcaRouter API Key')}
        value={orcarouterKey}
        onChange={(value) => settingsStore.setState({ orcarouterKey: value })}
        linkUrl="https://www.orcarouter.ai"
        linkLabel={t('OrcaRouterDashboardLink', 'OrcaRouter')}
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
          placeholder="openai/gpt-4o-mini"
        />
      </div>

      <MultiModalToggle
        enabled={enableMultiModal}
        onToggle={handleMultiModalToggle}
      />
    </>
  )
}
