import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from '../../toggleSwitch'

interface MultiModalToggleProps {
  enabled: boolean
  onToggle: () => void
  showDescription?: boolean
}

export const MultiModalToggle = ({
  enabled,
  onToggle,
  showDescription = true,
}: MultiModalToggleProps) => {
  const { t } = useTranslation()

  return (
    <div className="my-6">
      <div className="my-4 text-xl font-bold">{t('EnableMultiModal')}</div>
      <div className="my-2">
        <ToggleSwitch enabled={enabled} onChange={() => onToggle()} />
      </div>
      {showDescription && (
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('EnableMultiModalDescription')}
        </div>
      )}
    </div>
  )
}
