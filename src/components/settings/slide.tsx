import { useTranslation } from 'react-i18next'

import settingsStore from '@/features/stores/settings'
import menuStore from '@/features/stores/menu'
import { TextButton } from '../textButton'

const Slide = () => {
  const { t } = useTranslation()

  const slideMode = settingsStore((s) => s.slideMode)
  const conversationContinuityMode = settingsStore(
    (s) => s.conversationContinuityMode
  )

  const toggleSlideMode = () => {
    const newSlideMode = !slideMode
    settingsStore.setState({
      slideMode: newSlideMode,
      // スライドモードがオンになったら、会話継続モードをオフにする
      conversationContinuityMode: newSlideMode
        ? false
        : conversationContinuityMode,
    })
    if (!newSlideMode) {
      menuStore.setState({ slideVisible: false })
    }
  }

  return (
    <div className="my-40">
      <div className="my-16 typography-20 font-bold">{t('SlideMode')}</div>
      <div className="my-8">
        <TextButton onClick={toggleSlideMode}>
          {slideMode ? t('StatusOn') : t('StatusOff')}
        </TextButton>
      </div>
      <p className="text-sm text-gray-600">{t('SlideModeDescription')}</p>
      {slideMode && (
        <p className="text-sm text-red-600 mt-2">{t('SlideModeWarning')}</p>
      )}
    </div>
  )
}

export default Slide
