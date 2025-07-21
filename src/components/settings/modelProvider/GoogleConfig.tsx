import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../../textButton'
import { GenericAIServiceConfig } from './GenericAIServiceConfig'
import { googleSearchGroundingModels } from '@/features/constants/aiModels'
import { AIService } from '@/features/constants/settings'

interface GoogleConfigProps {
  googleKey: string
  selectAIModel: string
  customModel: boolean
  enableMultiModal: boolean
  useSearchGrounding: boolean
  dynamicRetrievalThreshold: number
  updateMultiModalModeForModel: (service: AIService, model: string) => void
}

export const GoogleConfig = ({
  googleKey,
  selectAIModel,
  customModel,
  enableMultiModal,
  useSearchGrounding,
  dynamicRetrievalThreshold,
  updateMultiModalModeForModel,
}: GoogleConfigProps) => {
  const { t } = useTranslation()

  const handleModelChange = useCallback(
    (model: string) => {
      settingsStore.setState({ selectAIModel: model })

      if (!googleSearchGroundingModels.includes(model as any)) {
        settingsStore.setState({ useSearchGrounding: false })
      }

      updateMultiModalModeForModel('google' as AIService, model)
    },
    [updateMultiModalModeForModel]
  )

  const handleCustomModelToggle = useCallback(() => {
    settingsStore.setState({ customModel: !customModel })
  }, [customModel])

  const handleMultiModalToggle = useCallback(() => {
    settingsStore.setState({ enableMultiModal: !enableMultiModal })
  }, [enableMultiModal])

  return (
    <>
      <GenericAIServiceConfig
        service="google"
        apiKey={googleKey}
        selectAIModel={selectAIModel}
        customModel={customModel}
        enableMultiModal={enableMultiModal}
        updateMultiModalModeForModel={updateMultiModalModeForModel}
        config={{
          keyLabel: t('GoogleAPIKeyLabel'),
          linkUrl: 'https://aistudio.google.com/app/apikey?hl=ja',
          linkLabel: 'Google AI Studio',
          showMultiModalToggle: true,
        }}
      />

      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('SearchGrounding')}</div>
        <div className="my-4">{t('SearchGroundingDescription')}</div>
        <div className="my-2">
          <TextButton
            onClick={() => {
              settingsStore.setState({
                useSearchGrounding: !useSearchGrounding,
              })
            }}
            disabled={
              !googleSearchGroundingModels.includes(selectAIModel as any)
            }
          >
            {useSearchGrounding ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>

        {useSearchGrounding &&
          googleSearchGroundingModels.includes(selectAIModel as any) && (
            <>
              <div className="mt-6 mb-4 text-xl font-bold">
                {t('DynamicRetrieval')}
              </div>
              <div className="my-4">{t('DynamicRetrievalDescription')}</div>
              <div className="my-4">
                <div className="mb-2 font-medium">
                  {t('DynamicRetrievalThreshold')}:{' '}
                  {dynamicRetrievalThreshold.toFixed(1)}
                </div>
                <div className="flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={dynamicRetrievalThreshold}
                    onChange={(e) => {
                      settingsStore.setState({
                        dynamicRetrievalThreshold: parseFloat(e.target.value),
                      })
                    }}
                    className="mt-2 mb-4 input-range"
                  />
                </div>
              </div>
            </>
          )}
      </div>
    </>
  )
}
