import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { useCallback } from 'react'

const ExternalLinkage = () => {
  const { t } = useTranslation()
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)

  const handleExternalLinkageModeChange = useCallback((newMode: boolean) => {
    settingsStore.setState({
      externalLinkageMode: newMode,
    })

    if (newMode) {
      settingsStore.setState({
        conversationContinuityMode: false,
        realtimeAPIMode: false,
      })
    }
  }, [])

  return (
    <div className="mb-40">
      <div className="mb-16 typography-20 font-bold">
        {t('ExternalLinkageMode')}
      </div>
      <div className="my-8">
        <TextButton
          onClick={() => {
            handleExternalLinkageModeChange(!externalLinkageMode)
          }}
        >
          {externalLinkageMode ? t('StatusOn') : t('StatusOff')}
        </TextButton>
      </div>
    </div>
  )
}
export default ExternalLinkage
