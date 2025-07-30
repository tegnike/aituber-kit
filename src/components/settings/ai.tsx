import ExternalLinkage from './externalLinkage'
import ModelProvider from './modelProvider'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

const AI = () => {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex items-center mb-6">
        <Image
          src="/images/setting-icons/ai-settings.svg"
          alt="AI Settings"
          width={24}
          height={24}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">{t('AISettings')}</h2>
      </div>
      <ExternalLinkage />
      <ModelProvider />
    </>
  )
}
export default AI
