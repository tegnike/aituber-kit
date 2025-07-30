import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import settingsStore from '@/features/stores/settings'
import {
  getDefaultModel,
  getMultiModalModels,
  isMultiModalAvailable,
} from '@/features/constants/aiModels'
import { TextButton } from '../textButton'
import toastStore from '@/features/stores/toast'

interface SlideConvertProps {
  onFolderUpdate: () => void // フォルダ更新のための関数
}

const SlideConvert: React.FC<SlideConvertProps> = ({ onFolderUpdate }) => {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [folderName, setFolderName] = useState<string>('')
  const { addToast } = toastStore()
  const aiService = settingsStore((s) => s.selectAIService)
  const selectLanguage = settingsStore((s) => s.selectLanguage)
  const selectAIModel = settingsStore((s) => s.selectAIModel)
  const enableMultiModal = settingsStore((s) => s.enableMultiModal)
  const multiModalMode = settingsStore((s) => s.multiModalMode)
  const customModel = settingsStore((s) => s.customModel)

  const [model, setModel] = useState<string>('')

  useEffect(() => {
    const defaultModel = getDefaultModel(aiService)
    setModel(defaultModel)
  }, [aiService])

  const [isLoading, setIsLoading] = useState<boolean>(false)
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

    if (
      !isMultiModalAvailable(
        aiService,
        selectAIModel,
        enableMultiModal,
        multiModalMode,
        customModel
      )
    ) {
      addToast({
        message: t('InvalidAIService'),
        type: 'error',
        duration: 5000,
      })
      return
    }

    let apiKey = ''
    const settings = settingsStore.getState()

    if (aiService === 'openai') apiKey = settings.openaiKey
    else if (aiService === 'anthropic') apiKey = settings.anthropicKey
    else if (aiService === 'google') apiKey = settings.googleKey
    else if (aiService === 'azure') apiKey = settings.azureKey
    else if (aiService === 'xai') apiKey = settings.xaiKey
    else if (aiService === 'groq') apiKey = settings.groqKey
    else if (aiService === 'cohere') apiKey = settings.cohereKey
    else if (aiService === 'mistralai') apiKey = settings.mistralaiKey
    else if (aiService === 'perplexity') apiKey = settings.perplexityKey
    else if (aiService === 'fireworks') apiKey = settings.fireworksKey
    else if (aiService === 'deepseek') apiKey = settings.deepseekKey
    else if (aiService === 'openrouter') apiKey = settings.openrouterKey
    else if (aiService === 'dify') apiKey = settings.difyKey

    if (!file || !folderName || !apiKey || !model) {
      addToast({
        message: t('PdfConvertSubmitError'),
        type: 'error',
        duration: 5000,
      })
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
      addToast({
        message: t('PdfConvertSuccess'),
        type: 'success',
        duration: 5000,
      })
    } else {
      addToast({
        message: t('PdfConvertError'),
        type: 'error',
        duration: 5000,
      })
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
          className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
        />
        <div className="my-4 font-bold">{t('PdfConvertModelSelect')}</div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="text-ellipsis px-4 py-2 w-full bg-white hover:bg-white-hover rounded-lg"
        >
          {aiService &&
            getMultiModalModels(aiService).map((model) => (
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
