import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { ApiKeyInput } from './ApiKeyInput'
import { MultiModalToggle } from './MultiModalToggle'
import { settingsControlClass } from '@/components/settings/formStyles'

interface APIRouteConfigProps {
  api_routeKey: string
  selectAIModel: string
  enableMultiModal: boolean
}

export const APIRouteConfig = ({
  api_routeKey,
  selectAIModel,
  enableMultiModal,
}: APIRouteConfigProps) => {
  const { t } = useTranslation()

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <ApiKeyInput
        label={t('APIRouteAPIKeyLabel', 'API Route API Key')}
        value={api_routeKey}
        onChange={(value) => settingsStore.setState({ api_routeKey: value })}
        linkUrl="https://www.api-route.com/api-keys"
        linkLabel={t('APIRouteDashboardLink', 'API Route Dashboard')}
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
          placeholder="gpt-6.1-sol"
        />
      </div>

      <p className="my-2 text-sm whitespace-pre-wrap">
        {t(
          'APIRouteModelNameInstruction',
          'Enter a model ID available to your API Route key, for example gpt-6.1-sol. Use the ID as returned by /v1/models, without adding a provider prefix. Enable multimodal only for a model that supports images.'
        )}
      </p>

      <MultiModalToggle
        enabled={enableMultiModal}
        onToggle={handleMultiModalToggle}
      />
    </>
  )
}
