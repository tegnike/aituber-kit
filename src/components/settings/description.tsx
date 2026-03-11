import { useTranslation } from 'react-i18next'
import Image from 'next/image'

const Description = () => {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <Image
            src="/images/setting-icons/description.svg"
            alt="Description Settings"
            width={24}
            height={24}
            className="mr-2"
          />
          <h2 className="text-2xl font-bold">{t('AboutThisApplication')}</h2>
        </div>
        <div className="mb-6">
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('AboutThisApplicationDescription2')}
          </div>
        </div>
        <div className="my-10">
          <div className="mb-4 text-xl font-bold">{t('Contact')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            <a
              href="mailto:support@aituberkit.com"
              className="text-black hover:text-gray-800 hover:underline transition-all duration-300 ease-in-out"
            >
              Email: support@aituberkit.com
            </a>
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            <a
              href="https://twitter.com/tegnike"
              className="text-black hover:text-gray-800 hover:underline transition-all duration-300 ease-in-out"
            >
              X(Twitter): @tegnike
            </a>
          </div>
        </div>
        <div className="mt-10">
          <div className="mb-4 text-xl font-bold">{t('Creator')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('CreatorDescription')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            <a
              href="https://nikechan.com"
              className="text-black hover:text-gray-800 hover:underline transition-all duration-300 ease-in-out"
            >
              URL: https://nikechan.com
            </a>
          </div>
        </div>
        <div className="mt-10">
          <div className="mb-4 text-xl font-bold">{t('Documentation')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('DocumentationDescription')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            <a
              href="https://docs.aituberkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:text-gray-800 hover:underline transition-all duration-300 ease-in-out"
            >
              https://docs.aituberkit.com/
            </a>
          </div>
        </div>
        <div className="mt-10">
          <div className="mb-4 text-xl font-bold">{t('Promotion')}</div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('PromotionDescription')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            <a
              href="https://promotion.aituberkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:text-gray-800 hover:underline transition-all duration-300 ease-in-out"
            >
              https://promotion.aituberkit.com/
            </a>
          </div>
        </div>

        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <div className="mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="fmb-1">これはAITuberKitのデモアプリです。</p>
            <p className="mb-2">デモ版のため、一部の機能が制限されています。</p>
            <p className="text-yellow-700">
              ⚠
              このアプリでは会話ログがサーバーに保存されるようになっています。ログは一部加工した上で公開される可能性があります。
            </p>
          </div>
        )}
      </div>
    </>
  )
}
export default Description
