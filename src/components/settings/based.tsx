import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

import { Language } from '@/features/constants/settings'
import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

const Based = () => {
  const { t } = useTranslation()
  const { characterName, selectedVrmPath } = settingsStore()
  const [vrmFiles, setVrmFiles] = useState<string[]>([])
  const selectLanguage = settingsStore((s) => s.selectLanguage)

  useEffect(() => {
    fetch('/api/get-vrm-list')
      .then((res) => res.json())
      .then((files) => setVrmFiles(files))
      .catch((error) => {
        console.error('Error fetching VRM list:', error)
      })
  }, [])

  const handleVrmUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload-vrm-list', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const { path } = await response.json()
      settingsStore.setState({ selectedVrmPath: path })
      const { viewer } = homeStore.getState()
      viewer.loadVrm(path)

      // リストを更新
      fetch('/api/get-vrm-list')
        .then((res) => res.json())
        .then((files) => setVrmFiles(files))
        .catch((error) => {
          console.error('Error fetching VRM list:', error)
        })
    }
  }

  return (
    <>
      <div className="mb-24">
        <div className="mb-16 typography-20 font-bold">{t('Language')}</div>
        <div className="my-8">
          <select
            className="px-16 py-8 bg-surface1 hover:bg-surface1-hover rounded-8"
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
                case 'en':
                  settingsStore.setState({ selectLanguage: 'en' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('en')
                  break
                case 'zh':
                  settingsStore.setState({ selectLanguage: 'zh' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('zh-TW')
                  break
                case 'ko':
                  settingsStore.setState({ selectLanguage: 'ko' })

                  if (jaVoiceSelected) {
                    settingsStore.setState({ selectVoice: 'google' })
                  }

                  i18n.changeLanguage('ko')
                  break
                default:
                  break
              }
            }}
          >
            <option value="ja">日本語 - Japanese</option>
            <option value="en">英語 - English</option>
            <option value="zh">繁體中文 - Traditional Chinese</option>
            <option value="ko">韓語 - Korean</option>
          </select>
        </div>
      </div>
      <div className="my-24">
        <div className="my-16 typography-20 font-bold">
          {t('CharacterName')}
        </div>
        <input
          className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
          type="text"
          placeholder={t('CharacterName')}
          value={characterName}
          onChange={(e) =>
            settingsStore.setState({ characterName: e.target.value })
          }
        />

        <div className="mt-24 mb-16 typography-20 font-bold">
          {t('CharacterModelLabel')}
        </div>
        <div className="mb-16 typography-16">{t('CharacterModelInfo')}</div>
        <select
          className="text-ellipsis px-16 py-8 w-col-span-2 bg-surface1 hover:bg-surface1-hover rounded-8"
          value={selectedVrmPath}
          onChange={(e) => {
            const path = e.target.value
            settingsStore.setState({ selectedVrmPath: path })
            const { viewer } = homeStore.getState()
            viewer.loadVrm(path)
          }}
        >
          {vrmFiles.map((file) => (
            <option key={file} value={`/vrm/${file}`}>
              {file.replace('.vrm', '')}
            </option>
          ))}
        </select>

        <div className="my-16">
          <TextButton
            onClick={() => {
              const { fileInput } = menuStore.getState()
              if (fileInput) {
                fileInput.accept = '.vrm'
                fileInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    handleVrmUpload(file)
                  }
                }
                fileInput.click()
              }
            }}
          >
            {t('OpenVRM')}
          </TextButton>
        </div>
      </div>
      <div className="mt-24">
        <div className="my-16 typography-20 font-bold">
          {t('BackgroundImage')}
        </div>
        <div className="my-8">
          <TextButton
            onClick={() => {
              const { bgFileInput } = menuStore.getState()
              bgFileInput?.click()
            }}
          >
            {t('ChangeBackgroundImage')}
          </TextButton>
        </div>
      </div>
    </>
  )
}
export default Based
