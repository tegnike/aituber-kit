import { logger } from '@/lib/logger'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link' // Link をインポート
import settingsStore from '@/features/stores/settings'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import menuStore from '@/features/stores/menu'
import slideStore from '@/features/stores/slide'
import { TextButton } from '../textButton'
import { settingsControlClass } from '@/components/settings/formStyles'
import { ToggleSwitch } from '../toggleSwitch'
import SlideConvert from './slideConvert'
import { useRestrictedMode } from '@/hooks/useRestrictedMode'
import { DisabledSettingNote } from '@/components/settings/disabledSettingNote'
import presentationStore from '@/features/stores/presentation'

const Slide = () => {
  const { t } = useTranslation()
  const { isRestrictedMode } = useRestrictedMode()
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const customModel = settingsStore((s) => s.customModel)

  const slideMode = settingsStore((s) => s.slideMode)

  const selectedSlideDocs = slideStore((s) => s.selectedSlideDocs)
  const externalDocument = presentationStore((s) => s.document)
  const externalPresentationId = presentationStore((s) => s.presentationId)
  const externalRevision = presentationStore((s) => s.revision)
  const externalState = presentationStore((s) => s.state)
  const [slideFolders, setSlideFolders] = useState<string[]>([])
  const [updateKey, setUpdateKey] = useState(0)

  useEffect(() => {
    // フォルダリストを取得
    fetch('/api/getSlideFolders')
      .then((response) => response.json())
      .then((data) => setSlideFolders(data))
      .catch((error) => logger.error('Error fetching slide folders:', error))
  }, [updateKey])

  const handleFolderUpdate = () => {
    setUpdateKey((prevKey) => prevKey + 1) // 更新トリガー
  }

  const toggleSlideMode = () => {
    const newSlideMode = !slideMode
    settingsStore.setState({ slideMode: newSlideMode })
    menuStore.setState({ slideVisible: newSlideMode })
  }

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    slideStore.setState({ selectedSlideDocs: e.target.value })
    slideStore.setState({ isPlaying: false })
    slideStore.setState({ currentSlide: 0 })
  }

  const isSlideAvailable = isMultiModalAvailable(
    selectAIService,
    selectAIModel,
    enableMultiModal,
    customModel
  )

  return (
    <>
      <div className="flex items-center mb-6">
        <Image
          src="/images/setting-icons/slide-settings.svg"
          alt="Slide Settings"
          width={24}
          height={24}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">{t('SlideSettings')}</h2>
      </div>
      <div className="mb-4 text-xl font-bold">{t('SlideMode')}</div>
      <p className="my-2 text-sm whitespace-pre-wrap">
        {t('SlideModeDescription')}
      </p>
      <DisabledSettingNote show={!isSlideAvailable}>
        {t('SlideModeDisabledInfo')}
      </DisabledSettingNote>
      <div className="my-2">
        <ToggleSwitch
          enabled={slideMode}
          onChange={() => toggleSlideMode()}
          disabled={!isSlideAvailable}
          testId="slide-mode-toggle"
        />
      </div>
      <div className="mt-6 mb-4 text-xl font-bold">
        {t('SelectedSlideDocs')}
      </div>
      {externalPresentationId && (
        <div
          className="mb-4 rounded-lg border border-primary p-3 text-sm"
          data-testid="external-presentation-status"
        >
          <div className="font-bold">{t('ExternalPresentation')}</div>
          <div>{externalDocument?.title ?? externalPresentationId}</div>
          <div>
            {t('ExternalPresentationRevision')}: {externalRevision}
          </div>
          <div>
            {t('ExternalPresentationState')}: {externalState}
          </div>
          <div className="mt-1 text-xs">
            {t('ExternalPresentationPriorityInfo')}
          </div>
        </div>
      )}
      {/* モバイルでは縦積み、sm以上では横並びにする */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          id="folder-select"
          data-testid="slide-folder-select"
          className={settingsControlClass.medium}
          value={selectedSlideDocs || ''}
          onChange={handleFolderChange}
          key={updateKey}
        >
          <option value="">{t('PleaseSelectSlide')}</option>
          {slideFolders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
        {/* 編集ページへのリンクボタン */}
        {selectedSlideDocs && ( // スライドが選択されている場合のみ表示
          <Link
            href={`/slide-editor/${selectedSlideDocs}`}
            passHref
            legacyBehavior
          >
            <a
              target="_blank" // 新しいタブで開く
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 text-sm bg-primary hover:bg-primary-hover rounded-3xl text-theme font-bold transition-colors duration-200 whitespace-nowrap"
            >
              {t('EditSlideScripts')}
              <Image
                src="/images/icons/external-link.svg"
                alt="open in new tab"
                width={16}
                height={16}
                className="ml-1"
              />
            </a>
          </Link>
        )}
      </div>
      {!isRestrictedMode && isSlideAvailable && (
        <SlideConvert onFolderUpdate={handleFolderUpdate} />
      )}
    </>
  )
}

export default Slide
