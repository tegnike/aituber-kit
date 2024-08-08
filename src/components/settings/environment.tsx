import { useTranslation } from 'react-i18next'

import menuStore from '@/features/stores/menu'
import { TextButton } from '../textButton'

const Environment = () => {
  const { t } = useTranslation()

  return (
    <div className="my-24">
      <div className="my-16 typography-20 font-bold">
        {t('BackgroundImage')}
      </div>
      <div className="my-8">
        <TextButton
          onClick={() => {
            const { bgFileInput } = menuStore.getState()
            bgFileInput?.click()
          }}
        >
          {t('ChangeBackgroundImage')}
        </TextButton>
      </div>
    </div>
  )
}
export default Environment
