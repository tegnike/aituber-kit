import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'
import Image from 'next/image'
import { Language } from '@/features/constants/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import { ToggleSwitch } from '../toggleSwitch'
import { IMAGE_CONSTANTS } from '@/constants/images'
import { useRestrictedMode } from '@/hooks/useRestrictedMode'
import { languageOptions } from '@/components/settings/languageOptions'

const Based = () => {
  const { t } = useTranslation()
  const { isRestrictedMode } = useRestrictedMode()
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const showAssistantText = settingsStore((s) => s.showAssistantText)
  const assistantTextStyle = settingsStore((s) => s.assistantTextStyle)
  const chatLogPosition = settingsStore((s) => s.chatLogPosition)
  const chatLogStyle = settingsStore((s) => s.chatLogStyle)
  const showCharacterName = settingsStore((s) => s.showCharacterName)
  const showControlPanel = settingsStore((s) => s.showControlPanel)
  const useVideoAsBackground = settingsStore((s) => s.useVideoAsBackground)
  const changeEnglishToJapanese = settingsStore(
    (s) => s.changeEnglishToJapanese
  )
  const colorTheme = settingsStore((s) => s.colorTheme)
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
    if (file.size > IMAGE_CONSTANTS.COMPRESSION.LARGE_FILE_THRESHOLD) {
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
          <div
            className="w-6 h-6 mr-2 icon-mask-default"
            style={{
              maskImage: 'url(/images/setting-icons/basic-settings.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
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
              settingsStore.setState({ selectLanguage: newLanguage })
              i18n.changeLanguage(newLanguage)
            }}
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {selectLanguage === 'ja' && (
        <div className="my-6">
          <div className="my-4 font-bold">{t('EnglishToJapanese')}</div>
          <div className="my-2">
            <ToggleSwitch
              enabled={changeEnglishToJapanese}
              onChange={(v) =>
                settingsStore.setState({ changeEnglishToJapanese: v })
              }
            />
          </div>
        </div>
      )}
      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="my-4 text-xl font-bold">{t('UserDisplayName')}</div>
        <input
          className="text-ellipsis px-4 py-2 w-full sm:w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
          type="text"
          placeholder={t('UserDisplayName')}
          value={settingsStore((s) => s.userDisplayName)}
          onChange={(e) =>
            settingsStore.setState({ userDisplayName: e.target.value })
          }
        />
      </div>
      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="my-4 text-xl font-bold">{t('BackgroundSettings')}</div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('BackgroundSettingsDescription')}
        </div>

        {isLoading && <div className="my-2">{t('Loading')}</div>}
        {error && <div className="my-2 text-red-500">{error}</div>}
        {uploadError && <div className="my-2 text-red-500">{uploadError}</div>}

        <div className="flex flex-col mb-4">
          <select
            className="text-ellipsis px-4 py-2 w-full sm:w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={backgroundImageUrl}
            onChange={(e) => {
              const path = e.target.value
              homeStore.setState({ backgroundImageUrl: path })
            }}
            disabled={isLoading || isUploading || isRestrictedMode}
          >
            <option value="/backgrounds/bg-c.png">
              {t('DefaultBackground')}
            </option>
            <option value="green">{t('GreenBackground')}</option>
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
            disabled={isLoading || isUploading || isRestrictedMode}
          >
            {isUploading ? t('Uploading') : t('UploadBackground')}
          </TextButton>
        </div>
      </div>

      {/* アシスタントテキスト表示設定 */}
      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="my-4 text-xl font-bold">{t('ShowAssistantText')}</div>
        <div className="my-2">
          <ToggleSwitch
            enabled={showAssistantText}
            onChange={(v) => settingsStore.setState({ showAssistantText: v })}
          />
        </div>
      </div>

      {/* 回答欄スタイル設定 */}
      {showAssistantText && (
        <div className="my-6">
          <div className="my-4 text-xl font-bold">
            {t('AssistantTextStyle')}
          </div>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('AssistantTextStyleInfo')}
          </div>
          <div className="flex flex-col mb-4">
            <select
              className="text-ellipsis px-4 py-2 w-full sm:w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
              value={assistantTextStyle}
              onChange={(e) =>
                settingsStore.setState({
                  assistantTextStyle: e.target.value as 'bubble' | 'borderless',
                })
              }
            >
              <option value="bubble">{t('AssistantTextStyleBubble')}</option>
              <option value="borderless">
                {t('AssistantTextStyleBorderless')}
              </option>
            </select>
          </div>
        </div>
      )}

      {/* 会話ログデザイン設定 */}
      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('ChatLogStyle')}</div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('ChatLogStyleInfo')}
        </div>
        <div className="flex flex-col mb-4">
          <select
            className="text-ellipsis px-4 py-2 w-full sm:w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={chatLogStyle}
            onChange={(e) =>
              settingsStore.setState({
                chatLogStyle: e.target.value as 'glass' | 'classic',
              })
            }
          >
            <option value="glass">{t('ChatLogStyleGlass')}</option>
            <option value="classic">{t('ChatLogStyleClassic')}</option>
          </select>
        </div>
      </div>

      {/* 会話ログ表示位置設定 */}
      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('ChatLogPosition')}</div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('ChatLogPositionInfo')}
        </div>
        <div className="flex flex-col mb-4">
          <select
            className="text-ellipsis px-4 py-2 w-full sm:w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={chatLogPosition}
            onChange={(e) =>
              settingsStore.setState({
                chatLogPosition: e.target.value as 'left' | 'right',
              })
            }
          >
            <option value="right">{t('ChatLogPositionRight')}</option>
            <option value="left">{t('ChatLogPositionLeft')}</option>
          </select>
        </div>
      </div>

      {/* キャラクター名表示設定 */}
      <div className="my-6">
        <div className="my-4 text-xl font-bold">{t('ShowCharacterName')}</div>
        <div className="my-2">
          <ToggleSwitch
            enabled={showCharacterName}
            onChange={(v) => settingsStore.setState({ showCharacterName: v })}
          />
        </div>
      </div>

      {/* コントロールパネル表示設定 */}
      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="my-4 text-xl font-bold">{t('ShowControlPanel')}</div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('ShowControlPanelInfo')}
        </div>

        <div className="my-2">
          <ToggleSwitch
            enabled={showControlPanel}
            onChange={(v) => settingsStore.setState({ showControlPanel: v })}
          />
        </div>
      </div>

      {/* カラーテーマ設定 */}
      <div className="border-t border-gray-300 pt-6 my-6">
        <div className="my-4 text-xl font-bold">{t('ColorTheme')}</div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('ColorThemeInfo')}
        </div>

        <div className="flex flex-col mb-4">
          <select
            className="text-ellipsis px-4 py-2 w-full sm:w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
            value={colorTheme}
            onChange={(e) => {
              const theme = e.target.value as
                | 'default'
                | 'cool'
                | 'mono'
                | 'ocean'
                | 'forest'
                | 'sunset'
              settingsStore.setState({ colorTheme: theme })
              // テーマをhtmlタグに適用
              document.documentElement.setAttribute('data-theme', theme)
            }}
          >
            <option value="default">{t('ThemeDefault')}</option>
            <option value="mono">{t('ThemeMono')}</option>
            <option value="cool">{t('ThemeCool')}</option>
            <option value="ocean">{t('ThemeOcean')}</option>
            <option value="forest">{t('ThemeForest')}</option>
            <option value="sunset">{t('ThemeSunset')}</option>
          </select>
        </div>
      </div>
    </>
  )
}
export default Based
