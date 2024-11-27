import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import settingsStore from '@/features/stores/settings'
import menuStore from '@/features/stores/menu'
import { TextButton } from '../textButton'
import homeStore from '@/features/stores/home'

const Character = () => {
  const { characterName, selectedVrmPath } = settingsStore()
  const [vrmFiles, setVrmFiles] = useState<string[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    fetch('/api/get-vrm-list')
      .then((res) => res.json())
      .then((files) => setVrmFiles(files))
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
      const listResponse = await fetch('/api/get-vrm-list')
      const files = await listResponse.json()
      setVrmFiles(files)
    }
  }

  return (
    <>
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

        <div className="my-8">
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
    </>
  )
}

export default Character
