import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link' // Link をインポート
import settingsStore from '@/features/stores/settings'
import { isMultiModalAvailable } from '@/features/constants/aiModels'
import menuStore from '@/features/stores/menu'
import slideStore from '@/features/stores/slide'
import { TextButton } from '../textButton'
import SlideConvert from './slideConvert'

const Slide = () => {
  const { t } = useTranslation()
  const selectAIService = settingsStore((s) => s.selectAIService)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const multiModalMode = settingsStore((s) => s.multiModalMode)
  const customModel = settingsStore((s) => s.customModel)

  const slideMode = settingsStore((s) => s.slideMode)

  const selectedSlideDocs = slideStore((s) => s.selectedSlideDocs)
  const [slideFolders, setSlideFolders] = useState<string[]>([])
  const [updateKey, setUpdateKey] = useState(0)

  useEffect(() => {
    if (slideMode) {
      // フォルダリストを取得
      fetch('/api/getSlideFolders')
        .then((response) => response.json())
        .then((data) => setSlideFolders(data))
        .catch((error) => console.error('Error fetching slide folders:', error))
    }
  }, [slideMode, updateKey])

  const handleFolderUpdate = () => {
    setUpdateKey((prevKey) => prevKey + 1) // 更新トリガー
  }

  const toggleSlideMode = () => {
    const newSlideMode = !slideMode
    settingsStore.setState({
      slideMode: newSlideMode,
    })
    menuStore.setState({ slideVisible: newSlideMode })
    if (newSlideMode) {
      settingsStore.setState({
        youtubeMode: false,
        conversationContinuityMode: false,
      })
    }
  }

  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    slideStore.setState({ selectedSlideDocs: e.target.value })
    slideStore.setState({ isPlaying: false })
    slideStore.setState({ currentSlide: 0 })
  }

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
      <p className="">{t('SlideModeDescription')}</p>
      <div className="my-2">
        <TextButton
          onClick={toggleSlideMode}
          disabled={
            !isMultiModalAvailable(
              selectAIService,
              selectAIModel,
              enableMultiModal,
              multiModalMode,
              customModel
            )
          }
        >
          {slideMode ? t('StatusOn') : t('StatusOff')}
        </TextButton>
      </div>
      {slideMode && (
        <>
          <div className="mt-6 mb-4 text-xl font-bold">
            {t('SelectedSlideDocs')}
          </div>
          {/* プルダウンと編集ボタンを横並びにする */}
          <div className="flex items-center gap-2">
            <select
              id="folder-select"
              className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg w-full md:w-1/2"
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
          {isMultiModalAvailable(
            selectAIService,
            selectAIModel,
            enableMultiModal,
            multiModalMode,
            customModel
          ) && <SlideConvert onFolderUpdate={handleFolderUpdate} />}
        </>
      )}
    </>
  )
}

export default Slide
