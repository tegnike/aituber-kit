import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import { TextButton } from '../textButton'

interface SlideConvertProps {
  onFolderUpdate: () => void // フォルダ更新のための関数
}

const SlideConvert: React.FC<SlideConvertProps> = ({ onFolderUpdate }) => {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [folderName, setFolderName] = useState<string>('')
  const [apiKey] = useState<string>(settingsStore.getState().openAiKey)
  const [model, setModel] = useState<string>('gpt-4o')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const selectLanguage = settingsStore.getState().selectLanguage
  const [selectedFileName, setSelectedFileName] = useState<string>('')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const selectedFile = event.target.files[0]
      setFile(selectedFile)
      setSelectedFileName(selectedFile.name)
    }
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file || !folderName || !apiKey || !model) {
      alert(t('PdfConvertSubmitError'))
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folderName', folderName)
    formData.append('apiKey', apiKey)
    formData.append('model', model)
    formData.append('selectLanguage', selectLanguage)

    const response = await fetch('/api/convertSlide', {
      method: 'POST',
      body: formData,
    })
    setIsLoading(false)

    // フォルダ更新関数を呼び出す
    if (response.ok) {
      onFolderUpdate()
      alert(t('PdfConvertSuccess'))
    } else {
      alert(t('PdfConvertError'))
    }
  }

  return (
    <div className="my-24">
      <form onSubmit={handleFormSubmit}>
        <div className="my-16 mb-16 typography-20 font-bold">
          {t('PdfConvertLabel')}
        </div>
        <p className="">{t('PdfConvertDescription')}</p>
        <div className="my-16 flex items-center">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
            accept=".pdf"
          />
          <TextButton
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('fileInput')?.click()
            }}
            type="button"
          >
            {t('PdfConvertFileUpload')}
          </TextButton>
          {selectedFileName && (
            <span className="ml-16 text-ellipsis overflow-hidden">
              {selectedFileName}
            </span>
          )}
        </div>
        <div className="my-16 font-bold">{t('PdfConvertFolderName')}</div>
        <input
          type="text"
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required
          className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
        />
        <div className="my-16 font-bold">{t('PdfConvertModelSelect')}</div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
        >
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="chatgpt-4o-latest">chatgpt-4o-latest</option>
          <option value="gpt-4o-2024-08-06">gpt-4o-2024-08-06</option>
          <option value="gpt-4o">gpt-4o(2024-05-13)</option>
          <option value="gpt-4-turbo">gpt-4-turbo</option>
        </select>
        <div className="my-16">
          <TextButton type="submit" disabled={isLoading}>
            {isLoading ? t('PdfConvertLoading') : t('PdfConvertButton')}
          </TextButton>
        </div>
      </form>
    </div>
  )
}

export default SlideConvert
