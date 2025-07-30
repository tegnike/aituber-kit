import { useTranslation } from 'react-i18next'
import { TextButton } from '../../textButton'

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
        <TextButton onClick={onToggle}>
          {enabled ? t('StatusOn') : t('StatusOff')}
        </TextButton>
      </div>
      {showDescription && (
        <div className="my-2 text-sm">{t('EnableMultiModalDescription')}</div>
      )}
    </div>
  )
}
