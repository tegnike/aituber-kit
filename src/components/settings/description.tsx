import { useTranslation } from 'react-i18next'

const Description = () => {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-24">
        <div className="mb-24">
          <div className="mb-16 typography-20 font-bold">
            {t('AboutThisApplication')}
          </div>
          <div className="my-8 whitespace-pre-line">
            {t('AboutThisApplicationDescription2')}
          </div>
        </div>
        <div className="my-40">
          <div className="mb-16 typography-20 font-bold">{t('Contact')}</div>
          <div className="my-8 whitespace-pre-line">
            <a
              href="mailto:support@aituberkit.com"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-300 ease-in-out"
            >
              Email: support@aituberkit.com
            </a>
          </div>
          <div className="my-8 whitespace-pre-line">
            <a
              href="https://twitter.com/tegnike"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-300 ease-in-out"
            >
              Twitter: @tegnike
            </a>
          </div>
        </div>
        <div className="mt-40">
          <div className="mb-16 typography-20 font-bold">{t('Creator')}</div>
          <div className="my-8 whitespace-pre-line">
            {t('CreatorDescription')}
          </div>
          <div className="my-8 whitespace-pre-line">
            <a
              href="https://nikechan.com"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-300 ease-in-out"
            >
              URL: https://nikechan.com
            </a>
          </div>
        </div>
        <div className="mt-40">
          <div className="mb-16 typography-20 font-bold">
            {t('Documentation')}
          </div>
          <div className="my-8 whitespace-pre-line">
            {t('DocumentationDescription')}
          </div>
          <div className="my-8 whitespace-pre-line">
            <a
              href="https://docs.aituberkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline transition-all duration-300 ease-in-out"
            >
              https://docs.aituberkit.com/
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
export default Description
