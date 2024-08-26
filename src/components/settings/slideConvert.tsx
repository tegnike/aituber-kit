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
  const [model, setModel] = useState<string>('gpt-4o-2024-08-06')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setFile(event.target.files[0])
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

    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData,
    })
    setIsLoading(false)

    // alert(response.ok ? t('PdfConvertSucess') : t('PdfConvertError'));
    // フォルダ更新関数を呼び出す
    if (response.ok) {
      onFolderUpdate() // 追加
      alert(t('PdfConvertSucess'))
    } else {
      alert(t('PdfConvertError'))
    }
  }

  return (
    <div>
      <form onSubmit={handleFormSubmit}>
        <div className="mt-24 mb-16 typography-20 font-bold">
          {t('PdfConvertLabel')}
        </div>
        <p className="">{t('PdfConvertDescription')}</p>
        <div className="mt-16 font-bold">{t('PdfConvertFileUpload')}</div>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
        />
        <div className="mt-16 font-bold">{t('PdfConvertFolderName')}</div>
        <input
          type="text"
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          required
          className="text-ellipsis px-16 py-8 w-col-span-4 bg-surface1 hover:bg-surface1-hover rounded-8"
        />
        <div className="mt-16 font-bold">{t('PdfConvertModelSelect')}</div>
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
