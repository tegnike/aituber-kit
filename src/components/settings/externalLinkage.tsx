import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { ToggleSwitch } from '../toggleSwitch'
import { useCallback } from 'react'

const ExternalLinkage = () => {
  const { t } = useTranslation()
  const externalLinkageMode = settingsStore((s) => s.externalLinkageMode)

  const handleExternalLinkageModeChange = useCallback((newMode: boolean) => {
    settingsStore.setState({ externalLinkageMode: newMode })
  }, [])

  return (
    <div className="mb-10">
      <div className="mb-4 text-xl font-bold">{t('ExternalLinkageMode')}</div>
      <div className="my-2">
        <ToggleSwitch
          enabled={externalLinkageMode}
          onChange={handleExternalLinkageModeChange}
        />
      </div>
    </div>
  )
}
export default ExternalLinkage
