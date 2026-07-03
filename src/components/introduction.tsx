import i18n from 'i18next'
import { useEffect, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { IconButton } from './iconButton'
import { Link } from './link'
import { isLanguageSupported } from '@/features/constants/settings'

export const Introduction = () => {
  const showIntroduction = homeStore((s) => s.showIntroduction)
  const selectLanguage = settingsStore((s) => s.selectLanguage)

  const [displayIntroduction, setDisplayIntroduction] = useState(false)
  const [opened, setOpened] = useState(true)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const { t } = useTranslation()

  useEffect(() => {
    setDisplayIntroduction(homeStore.getState().showIntroduction)
  }, [showIntroduction])

  const updateLanguage = () => {
    console.log('i18n.language', i18n.language)

    let languageCode = i18n.language

    settingsStore.setState({
      selectLanguage: isLanguageSupported(languageCode) ? languageCode : 'ja',
    })
  }

  const handleClose = () => {
    setOpened(false)
    updateLanguage()

    // Only update showIntroduction if "don't show again" is checked
    if (dontShowAgain) {
      homeStore.setState({
        showIntroduction: false,
      })
    }
  }

  return displayIntroduction && opened ? (
    <div className="absolute z-40 flex h-full w-full items-center bg-black/35 px-3 py-8 font-M_PLUS_2 backdrop-blur-sm sm:px-6">
      <div className="theme-surface-elevated relative mx-auto max-h-full w-full max-w-3xl overflow-y-auto rounded-xl border p-4 text-theme-default shadow-xl sm:p-6">
        <div className="sticky -top-4 z-10 -mx-4 mb-5 flex items-center justify-between border-b border-primary/20 bg-[color-mix(in_srgb,var(--color-text-base)_94%,transparent)] px-4 py-3 backdrop-blur-md sm:-top-6 sm:-mx-6 sm:px-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-text-primary">
              AITuberKit
            </div>
            <div className="text-lg font-bold text-secondary">
              {t('AboutThisApplication')}
            </div>
          </div>
          <IconButton
            iconName="24/Close"
            isProcessing={false}
            onClick={handleClose}
            className="bg-secondary shadow-md shadow-secondary/15 ring-1 ring-secondary/15 transition-colors duration-200 hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
          ></IconButton>
        </div>
        <div className="mb-6">
          <div className="leading-relaxed">
            <Trans i18nKey="AboutThisApplicationDescription2" />
          </div>
        </div>
        <div className="my-6">
          <div className="my-2 text-xl font-bold text-secondary">
            {t('TechnologyIntroduction')}
          </div>
          <div className="leading-relaxed">
            <Trans
              i18nKey="TechnologyIntroductionDescription1"
              components={{ b: <b /> }}
            />
            <Link
              url={'https://github.com/pixiv/ChatVRM'}
              label={t('TechnologyIntroductionLink1')}
            />
            {t('TechnologyIntroductionDescription2')}
          </div>
          <div className="my-4">
            {t('TechnologyIntroductionDescription3')}
            <Link
              url={'https://github.com/pixiv/three-vrm'}
              label={'@pixiv/three-vrm'}
            />
            {t('TechnologyIntroductionDescription4')}
            <Link
              url={
                'https://openai.com/blog/introducing-chatgpt-and-whisper-apis'
              }
              label={'OpenAI API'}
            />
            {t('TechnologyIntroductionDescription5')}
            <Link url={'https://voicevox.hiroshiba.jp/'} label={'VOICEVOX'} />
            {t('TechnologyIntroductionDescription6')}
            <Link
              url={'https://docs.aituberkit.com/'}
              label={t('TechnologyIntroductionLink2')}
            />
            {t('TechnologyIntroductionDescription7')}
          </div>
          <div className="my-4 leading-relaxed">
            {t('SourceCodeDescription1')}
            <br />
            {t('RepositoryURL')}
            <span> </span>
            <Link
              url={'https://github.com/tegnike/aituber-kit'}
              label={'https://github.com/tegnike/aituber-kit'}
            />
          </div>
          <div className="my-4">{t('SourceCodeDescription2')}</div>
        </div>

        <div className="my-6">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => {
                setDontShowAgain(e.target.checked)
              }}
              className="h-4 w-4 accent-primary"
            />
            <span>{t('DontShowIntroductionNextTime')}</span>
          </label>
        </div>

        <div className="my-6">
          <button
            onClick={handleClose}
            className="rounded-full bg-secondary px-6 py-2 font-bold text-theme shadow-md shadow-secondary/15 transition-colors hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
          >
            {t('Close')}
          </button>
        </div>

        {selectLanguage === 'ja' && (
          <div className="mt-6 text-sm text-text-primary">
            <p>{t('LanguageCanBeSelectedFromSettings')}</p>
          </div>
        )}

        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
          <div className="mt-6 rounded-lg border border-secondary/30 bg-[color-mix(in_srgb,var(--color-secondary)_12%,var(--color-text-base))] p-4 text-sm text-theme-default">
            <p className="mb-1">{t('DemoModeAppNotice')}</p>
            <p className="mb-2">{t('DemoModeLimitedFeaturesNotice')}</p>
            <p className="text-secondary">⚠ {t('DemoModeLogNotice')}</p>
          </div>
        )}
      </div>
    </div>
  ) : null
}
