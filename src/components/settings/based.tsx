import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import Image from 'next/image'
import { Language } from '@/features/constants/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const Based = () => {
  const { t } = useTranslation()
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const showAssistantText = settingsStore((s) => s.showAssistantText)
  const showCharacterName = settingsStore((s) => s.showCharacterName)
  const showControlPanel = settingsStore((s) => s.showControlPanel)
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const changeEnglishToJapanese = settingsStore(
    (s) => s.changeEnglishToJapanese
  )
  const [backgroundFiles, setBackgroundFiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const backgroundImageUrl = homeStore((s) => s.backgroundImageUrl)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    fetch('/api/get-background-list')
      .then((res) => res.json())
      .then((files) =>
        setBackgroundFiles(files.filter((file: string) => file !== 'bg-c.png'))
      )
      .catch((error) => {
        console.error('Error fetching background list:', error)
        setError(t('BackgroundListFetchError'))
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [t])

  const handleBackgroundUpload = async (file: File) => {
    // ファイルタイプの検証
    if (!file.type.startsWith('image/')) {
      setUploadError(t('OnlyImageFilesAllowed'))
      return
    }

    // ファイルサイズの検証（例：5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('FileSizeLimitExceeded'))
      return
    }

    setIsUploading(true)
    setUploadError(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload-background', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`${t('UploadFailed')}: ${response.status}`)
      }

      const { path } = await response.json()
      homeStore.setState({ backgroundImageUrl: path })

      // バックグラウンドリストを更新
      setIsLoading(true)
      setError(null)
      const listResponse = await fetch('/api/get-background-list')
      if (!listResponse.ok) {
        throw new Error(t('BackgroundListFetchError'))
      }
      const files = await listResponse.json()
      setBackgroundFiles(files.filter((file: string) => file !== 'bg-c.png'))
    } catch (error) {
      console.error('Error uploading background:', error)
      setUploadError(t('BackgroundUploadError'))
    } finally {
      setIsUploading(false)
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center mb-6">
          <Image
            src="/images/setting-icons/basic-settings.svg"
            alt="Basic Settings"
            width={24}
            height={24}
            className="mr-2"
          />
          <h2 className="text-2xl font-bold">{t('BasedSettings')}</h2>
        </div>
        <div className="mb-4 text-xl font-bold">{t('Language')}</div>
        <div className="my-2">
          <select
            className="px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
            value={selectLanguage}
            onChange={(e) => {
              const newLanguage = e.target.value as Language

              const ss = settingsStore.getState()
              const jaVoiceSelected =
                ss.selectVoice === 'voicevox' ||
                ss.selectVoice === 'koeiromap' ||
                ss.selectVoice === 'aivis_speech' ||
                ss.selectVoice === 'nijivoice'

              switch (newLanguage) {
                case 'ja':
                  settingsStore.setState({ selectLanguage: 'ja' })
                  i18n.changeLanguage('ja')
                  break
                default:
                  // 日本語以外の言語はすべて同じ処理
                  settingsStore.setState({ selectLanguage: newLanguage })

                  // 日本語専用の音声が選択されている場合は、googleに変更
                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage(newLanguage)
                  break
              }
            }}
          >
            <option value="ar">Arabic - アラビア語</option>
            <option value="en">English - 英語</option>
            <option value="fr">French - フランス語</option>
            <option value="de">German - ドイツ語</option>
            <option value="hi">Hindi - ヒンディー語</option>
            <option value="it">Italian - イタリア語</option>
            <option value="ja">Japanese - 日本語</option>
            <option value="ko">Korean - 韓語</option>
            <option value="pl">Polish - ポーランド語</option>
            <option value="pt">Portuguese - ポルトガル語</option>
            <option value="ru">Russian - ロシア語</option>
            <option value="es">Spanish - スペイン語</option>
            <option value="th">Thai - タイ語</option>
            <option value="zh">Traditional Chinese - 繁體中文</option>
            <option value="vi">Vietnamese - ベトナム語</option>
          </select>
        </div>
      </div>
      {selectLanguage === 'ja' && (
        <div className="my-6">
          <div className="my-4 text-base font-bold">
            {t('EnglishToJapanese')}
          </div>
          <div className="my-2">
            <TextButton
              onClick={() =>
                settingsStore.setState((prevState) => ({
                  changeEnglishToJapanese: !prevState.changeEnglishToJapanese,
                }))
              }
            >
              {t(changeEnglishToJapanese ? 'StatusOn' : 'StatusOff')}
            </TextButton>
          </div>
        </div>
      )}
      <div className="mt-6">
        <div className="my-4 text-xl font-bold">{t('BackgroundSettings')}</div>
        <div className="my-4">{t('BackgroundSettingsDescription')}</div>

        {isLoading && <div className="my-2">{t('Loading')}</div>}
        {error && <div className="my-2 text-red-500">{error}</div>}
        {uploadError && <div className="my-2 text-red-500">{uploadError}</div>}

        <div className="flex flex-col mb-4">
          <label className="mb-2 text-base">{t('BackgroundImage')}</label>
          <select
            className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={backgroundImageUrl}
            onChange={(e) => {
              const path = e.target.value
              homeStore.setState({ backgroundImageUrl: path })
            }}
            disabled={isLoading || isUploading}
          >
            <option value="/backgrounds/bg-c.png">
              {t('DefaultBackground')}
            </option>
            {backgroundFiles.map((file) => (
              <option key={file} value={`/backgrounds/${file}`}>
                {file}
              </option>
            ))}
          </select>
        </div>

        <div className="my-4">
          <TextButton
            onClick={() => {
              const { fileInput } = menuStore.getState()
              if (fileInput) {
                fileInput.accept = 'image/*'
                fileInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    handleBackgroundUpload(file)
                  }
                }
                fileInput.click()
              }
            }}
            disabled={isLoading || isUploading}
          >
            {isUploading ? t('Uploading') : t('UploadBackground')}
          </TextButton>
        </div>
      </div>

      {/* アシスタントテキスト表示設定 */}
      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('ShowAssistantText')}</div>
        <div className="my-2">
          <TextButton
            onClick={() =>
              settingsStore.setState((s) => ({
                showAssistantText: !s.showAssistantText,
              }))
            }
          >
            {showAssistantText ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>

      {/* キャラクター名表示設定 */}
      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('ShowCharacterName')}</div>
        <div className="my-2">
          <TextButton
            onClick={() =>
              settingsStore.setState((s) => ({
                showCharacterName: !s.showCharacterName,
              }))
            }
          >
            {showCharacterName ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>

      {/* コントロールパネル表示設定 */}
      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('ShowControlPanel')}</div>
        <div className="my-4 text-base whitespace-pre-wrap">
          {t('ShowControlPanelInfo')}
        </div>

        <div className="my-2">
          <TextButton
            onClick={() =>
              settingsStore.setState({
                showControlPanel: !showControlPanel,
              })
            }
          >
            {showControlPanel ? t('StatusOn') : t('StatusOff')}
          </TextButton>
        </div>
      </div>
    </>
  )
}
export default Based
