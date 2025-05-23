import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore, {
  multiModalAIServiceKey,
} from '@/features/stores/settings'
import {
  getDefaultModel,
  getSlideConvertModels,
} from '@/features/constants/aiModels'
import { isCurrentModelMultiModal } from '@/features/utils/multimodal'
import { TextButton } from '../textButton'

interface SlideConvertProps {
  onFolderUpdate: () => void // フォルダ更新のための関数
}

const SlideConvert: React.FC<SlideConvertProps> = ({ onFolderUpdate }) => {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [folderName, setFolderName] = useState<string>('')
  const aiService = settingsStore.getState()
    .selectAIService as multiModalAIServiceKey

  const [model, setModel] = useState<string>('')

  useEffect(() => {
    const defaultModel = getDefaultModel(aiService)
    setModel(defaultModel)
  }, [aiService])

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

    // if (!multiModalAIServices.includes(aiService)) {
    if (!isCurrentModelMultiModal()) {
      alert(t('InvalidAIService'))
      return
    }

    const apiKeyName = `${aiService}Key` as const
    const apiKey = settingsStore.getState()[apiKeyName]

    if (!file || !folderName || !apiKey || !model) {
      alert(t('PdfConvertSubmitError'))
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folderName', folderName)
    formData.append('aiService', aiService)
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
    <div className="mt-6">
      <form onSubmit={handleFormSubmit}>
        <div className="my-4 mb-4 text-xl font-bold">
          {t('PdfConvertLabel')}
        </div>
        <p className="">{t('PdfConvertDescription')}</p>
        <div className="my-4 flex items-center">
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
            <span className="ml-4 text-ellipsis overflow-hidden">
              {selectedFileName}
            </span>
          )}
        </div>
        <div className="my-4 font-bold">{t('PdfConvertFolderName')}</div>
        <input
          type="text"
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required
          className="text-ellipsis px-4 py-2 w-col-span-4 bg-white hover:bg-white-hover rounded-lg"
        />
        <div className="my-4 font-bold">{t('PdfConvertModelSelect')}</div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-ellipsis px-4 py-2 w-col-span-4 bg-white hover:bg-white-hover rounded-lg"
        >
          {aiService &&
            getSlideConvertModels(aiService).map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
        </select>
        <div className="mt-4">
          <TextButton type="submit" disabled={isLoading}>
            {isLoading ? t('PdfConvertLoading') : t('PdfConvertButton')}
          </TextButton>
        </div>
      </form>
    </div>
  )
}

export default SlideConvert
