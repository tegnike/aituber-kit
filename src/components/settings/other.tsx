import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'
import AdvancedSettings from './advancedSettings'
import MessageReceiverSetting from './messageReceiver'
import PresetQuestions from './presetQuestions'

const Other = () => {
  const { t } = useTranslation()
  const {
    useVideoAsBackground,
  } = settingsStore()
  const [backgroundFiles, setBackgroundFiles] = useState<string[]>([])
  const backgroundImageUrl = homeStore((s) => s.backgroundImageUrl)

  useEffect(() => {
    fetch('/api/get-background-list')
      .then((res) => res.json())
      .then((files) => setBackgroundFiles(files))
      .catch((error) => {
        console.error('Error fetching background list:', error)
      })
  }, [])

  const handleBackgroundUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload-background', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const { path } = await response.json()
      homeStore.setState({ backgroundImageUrl: path })

      fetch('/api/get-background-list')
        .then((res) => res.json())
        .then((files) => setBackgroundFiles(files))
        .catch((error) => {
          console.error('Error fetching background list:', error)
        })
    }
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Image
          src="/images/setting-icons/other-settings.svg"
          alt="Other Settings"
          width={24}
          height={24}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">{t('OtherSettings')}</h2>
      </div>

      {/* 背景設定セクション追加 */}
      <div className="mb-4">
        <div className="my-6 mb-2">
          <div className="my-4 text-xl font-bold">{t('BackgroundSettings')}</div>
          <div className="my-4">{t('BackgroundSettingsDescription')}</div>
        </div>

        <div className="flex flex-col mb-4">
          <label className="mb-2 text-base">{t('BackgroundImage')}</label>
          <select
            className="text-ellipsis px-4 py-2 bg-white hover:bg-white-hover rounded-lg"
            value={backgroundImageUrl}
            onChange={(e) => {
              const path = e.target.value
              homeStore.setState({ backgroundImageUrl: path })
            }}
          >
            <option value="/bg-c.png">{t('DefaultBackground')}</option>
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
          >
            {t('UploadBackground')}
          </TextButton>
        </div>

        <div className="flex items-center mt-4">
          <input
            className="h-4 w-4 m-1 rounded border-gray-300 cursor-pointer"
            type="checkbox"
            id="useVideoAsBackground"
            checked={useVideoAsBackground}
            onChange={(e) =>
              settingsStore.setState({
                useVideoAsBackground: e.target.checked,
              })
            }
          />
          <label
            htmlFor="useVideoAsBackground"
            className="ml-2 text-base cursor-pointer"
          >
            {t('UseVideoAsBackground')}
          </label>
        </div>
      </div>

      <AdvancedSettings />
      <PresetQuestions />
      <MessageReceiverSetting />
    </>
  )
}
export default Other
