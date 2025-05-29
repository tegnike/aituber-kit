import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore, { SettingsState } from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import { TextButton } from '../textButton'
import { IconButton } from '../iconButton'
import { live2dStorage, validateCubismCoreFile } from '@/lib/indexedDB'

// Character型の定義
type Character = Pick<
  SettingsState,
  | 'characterName'
  | 'showAssistantText'
  | 'showCharacterName'
  | 'systemPrompt'
  | 'characterPreset1'
  | 'characterPreset2'
  | 'characterPreset3'
  | 'characterPreset4'
  | 'characterPreset5'
  | 'customPresetName1'
  | 'customPresetName2'
  | 'customPresetName3'
  | 'customPresetName4'
  | 'customPresetName5'
  | 'selectedPresetIndex'
  | 'selectedVrmPath'
  | 'selectedLive2DPath'
>

const emotionFields = [
  {
    key: 'neutralEmotions',
    label: 'Neutral Emotions',
    defaultValue: ['Neutral'],
  },
  {
    key: 'happyEmotions',
    label: 'Happy Emotions',
    defaultValue: ['Happy,Happy2'],
  },
  {
    key: 'sadEmotions',
    label: 'Sad Emotions',
    defaultValue: ['Sad,Sad2,Troubled'],
  },
  {
    key: 'angryEmotions',
    label: 'Angry Emotions',
    defaultValue: ['Angry,Focus'],
  },
  {
    key: 'relaxedEmotions',
    label: 'Relaxed Emotions',
    defaultValue: ['Relaxed'],
  },
  {
    key: 'surprisedEmotions',
    label: 'Surprised Emotions',
    defaultValue: ['Surprised'],
  },
] as const

const motionFields = [
  { key: 'idleMotionGroup', label: 'Idle Motion Group', defaultValue: 'Idle' },
  {
    key: 'neutralMotionGroup',
    label: 'Neutral Motion Group',
    defaultValue: 'Neutral',
  },
  {
    key: 'happyMotionGroup',
    label: 'Happy Motion Group',
    defaultValue: 'Happy',
  },
  { key: 'sadMotionGroup', label: 'Sad Motion Group', defaultValue: 'Sad' },
  {
    key: 'angryMotionGroup',
    label: 'Angry Motion Group',
    defaultValue: 'Angry',
  },
  {
    key: 'relaxedMotionGroup',
    label: 'Relaxed Motion Group',
    defaultValue: 'Relaxed',
  },
  {
    key: 'surprisedMotionGroup',
    label: 'Surprised Motion Group',
    defaultValue: 'Surprised',
  },
] as const

interface Live2DModel {
  path: string
  name: string
  expressions: string[]
  motions: string[]
}

type EmotionFieldKey = (typeof emotionFields)[number]['key']

const Live2DSettingsForm = () => {
  const store = settingsStore()
  const { t } = useTranslation()
  const [currentModel, setCurrentModel] = useState<Live2DModel | null>(null)
  const [openDropdown, setOpenDropdown] = useState<EmotionFieldKey | null>(null)

  useEffect(() => {
    // 現在選択されているLive2Dモデルの情報を取得
    const fetchCurrentModel = async () => {
      try {
        const response = await fetch('/api/get-live2d-list')
        const models: Live2DModel[] = await response.json()
        const selected = models.find(
          (model) => model.path === store.selectedLive2DPath
        )
        setCurrentModel(selected || null)
      } catch (error) {
        console.error('Error fetching Live2D model info:', error)
      }
    }

    if (store.selectedLive2DPath) {
      fetchCurrentModel()
    }
  }, [store.selectedLive2DPath])

  // コンポーネントマウント時にデフォルト値を設定
  useEffect(() => {
    const updates: Record<string, any> = {}

    emotionFields.forEach((field) => {
      if (!store[field.key] || store[field.key].length === 0) {
        updates[field.key] = field.defaultValue
      }
    })

    motionFields.forEach((field) => {
      if (!store[field.key] || store[field.key] === '') {
        updates[field.key] = field.defaultValue
      }
    })

    if (Object.keys(updates).length > 0) {
      settingsStore.setState(updates)
    }
  }, [])

  const handleEmotionChange = (
    key: EmotionFieldKey,
    expression: string,
    checked: boolean
  ) => {
    const currentValues = store[key]
    const newValues = checked
      ? [...currentValues, expression]
      : currentValues.filter((value) => value !== expression)

    settingsStore.setState({
      [key]: newValues,
    })
  }

  const handleMotionChange = (key: string, value: string) => {
    settingsStore.setState({
      [key]: value,
    })
  }

  if (!currentModel) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        {t('Live2D.LoadingModel')}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <div className="mb-4 text-xl font-bold">{t('Live2D.Emotions')}</div>
        <div className="mb-6 text-base whitespace-pre-line">
          {t('Live2D.EmotionInfo')}
        </div>
        <div className="space-y-4 text-sm">
          {emotionFields.map((field) => (
            <div key={field.key}>
              <label className="block mb-2 text-base font-bold">
                {t(`Live2D.${field.key}`)}
              </label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full px-2 py-2 bg-white hover:bg-white-hover rounded-lg text-left flex items-center justify-between"
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === field.key ? null : field.key
                    )
                  }
                >
                  <div className="flex flex-wrap gap-1">
                    {store[field.key].length > 0 ? (
                      store[field.key].map((expression) => (
                        <span
                          key={expression}
                          className="inline-flex items-center px-2 py-1 bg-primary/10 rounded-lg mr-1"
                        >
                          {expression}
                          <button
                            type="button"
                            className="ml-4 text-gray-500 hover:text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEmotionChange(field.key, expression, false)
                            }}
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="">{t('Live2D.SelectEmotions')}</span>
                    )}
                  </div>
                  <svg
                    className={`h-4 w-4  transition-transform ${
                      openDropdown === field.key ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2 5l6 6 6-6"
                    />
                  </svg>
                </button>
                {openDropdown === field.key && (
                  <div className="absolute z-10 w-full mt-4 max-h-[200px] overflow-y-auto bg-white rounded-lg shadow-lg border-gray-200 divide-y divide-gray-200">
                    {currentModel.expressions.map((expression) => (
                      <label
                        key={expression}
                        className="flex items-center px-4 py-2 hover:bg-white-hover cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                          checked={store[field.key].includes(expression)}
                          onChange={(e) =>
                            handleEmotionChange(
                              field.key,
                              expression,
                              e.target.checked
                            )
                          }
                        />
                        <span className="text-base">{expression}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="">
        <div className="mb-4 text-xl font-bold">{t('Live2D.MotionGroups')}</div>
        <div className="mb-6 text-base text-gray-500 whitespace-pre-line">
          {t('Live2D.MotionGroupsInfo')}
        </div>
        <div className="space-y-4">
          {motionFields.map((field) => (
            <div key={field.key}>
              <label className="block mb-2 text-base font-bold">
                {t(`Live2D.${field.key}`)}
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2 bg-white hover:bg-white-hover rounded-lg appearance-none cursor-pointer"
                  value={store[field.key]}
                  onChange={(e) =>
                    handleMotionChange(field.key, e.target.value)
                  }
                >
                  <option value="" className="">
                    {t('Live2D.SelectMotionGroup')}
                  </option>
                  {currentModel.motions.map((motion) => (
                    <option
                      key={motion}
                      value={motion}
                      className="py-4 px-8 hover:bg-primary hover:text-white"
                    >
                      {motion}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-16 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 "
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M2 5l6 6 6-6"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface StoredFileInfo {
  fileName: string
  fileSize: number
  uploadDate: Date
}

// Live2D Cubism Core管理コンポーネント
const Live2DCubismCoreManager = () => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [storedFile, setStoredFile] = useState<StoredFileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ページ読み込み時に保存されているファイル情報を取得
  useEffect(() => {
    checkStoredFile()
  }, [])

  const checkStoredFile = async () => {
    try {
      setIsLoading(true)
      const coreFile = await live2dStorage.getCoreFile()
      if (coreFile) {
        setStoredFile({
          fileName: coreFile.fileName,
          fileSize: coreFile.fileSize,
          uploadDate: coreFile.uploadDate,
        })
      } else {
        setStoredFile(null)
      }
    } catch (error) {
      console.error('Error checking stored file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      // ファイル検証
      const validation = validateCubismCoreFile(file)
      if (!validation.isValid) {
        setUploadError(validation.error || 'ファイルが無効です')
        return
      }

      // ファイル保存
      await live2dStorage.saveCoreFile(file)
      setUploadSuccess(true)
      await checkStoredFile() // 保存情報を更新

      // 成功メッセージを一定時間後に消す
      setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError('ファイルのアップロードに失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileDelete = async () => {
    try {
      await live2dStorage.deleteCoreFile()
      setStoredFile(null)
      setUploadSuccess(false)
      setUploadError(null)
    } catch (error) {
      console.error('Error deleting file:', error)
      setUploadError('ファイルの削除に失敗しました')
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <div className="text-xl font-bold">Cubism Core設定</div>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="text-xl font-bold">Cubism Core設定</div>
      <div className="text-base text-gray-600 whitespace-pre-line">
        Live2D機能を使用するために必要なCubism Coreファイルを管理します。
      </div>

      {/* アップロード状態の表示 */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          ⚠️ {uploadError}
        </div>
      )}

      {uploadSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          ✅ ファイルが正常にアップロードされました
        </div>
      )}

      {/* 現在のファイル情報 */}
      {storedFile && (
        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-green-600 text-2xl">📄</div>
              <div>
                <p className="font-medium text-green-800">
                  {storedFile.fileName}
                </p>
                <p className="text-sm text-green-600">
                  {formatFileSize(storedFile.fileSize)} •{' '}
                  {formatDate(storedFile.uploadDate)}
                </p>
              </div>
            </div>
            <IconButton
              iconName="24/Close"
              isProcessing={false}
              onClick={handleFileDelete}
              backgroundColor="bg-red-100 hover:bg-red-200"
              iconColor="text-red-600"
            />
          </div>
        </div>
      )}

      {/* ファイルアップロード領域 */}
      <div className="space-y-2">
        <div className="text-base font-bold">Cubism Coreファイル</div>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : storedFile
                ? 'border-gray-200 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-4xl mb-2">📁</div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            {storedFile ? 'ファイルを更新する' : 'ファイルをドラッグ＆ドロップ'}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            または、ボタンをクリックしてファイルを選択
          </p>

          <input
            type="file"
            accept=".js"
            onChange={handleInputChange}
            className="hidden"
            id="cubism-core-upload"
            disabled={isUploading}
          />
          <TextButton
            onClick={() => {
              const input = document.getElementById(
                'cubism-core-upload'
              ) as HTMLInputElement
              input?.click()
            }}
            disabled={isUploading}
          >
            {isUploading ? '処理中...' : 'ファイルを選択'}
          </TextButton>
        </div>
      </div>

      {/* ファイル要件の説明 */}
      <div className="text-sm text-gray-600">
        <p className="font-medium mb-2">ファイル要件：</p>
        <ul className="list-disc list-inside space-y-1 ml-4 text-xs">
          <li>ファイル名に「live2dcubismcore」を含む</li>
          <li>拡張子：.js</li>
          <li>ファイルサイズ：100KB ～ 5MB</li>
        </ul>
      </div>

      {/* ダウンロードリンク */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-medium text-blue-800 mb-1">
          ファイルの取得方法：
        </p>
        <a
          href="https://www.live2d.com/sdk/download/web/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-xs"
        >
          Live2D公式サイト
        </a>
        <span className="text-xs text-blue-700">
          {' '}
          からCubism SDK for Webをダウンロードし、
        </span>
        <br />
        <code className="text-xs bg-blue-100 px-1 rounded">
          live2dcubismcore.min.js
        </code>
        <span className="text-xs text-blue-700">
          {' '}
          ファイルを抽出してアップロードしてください。
        </span>
      </div>
    </div>
  )
}

const Character = () => {
  const { t } = useTranslation()
  const { characterName, selectedVrmPath, selectedLive2DPath, modelType } =
    settingsStore()
  const [vrmFiles, setVrmFiles] = useState<string[]>([])
  const [live2dModels, setLive2dModels] = useState<
    Array<{ path: string; name: string }>
  >([])
  const selectAIService = settingsStore((s) => s.selectAIService)
  const systemPrompt = settingsStore((s) => s.systemPrompt)
  const characterPresets = [
    {
      key: 'characterPreset1',
      value: settingsStore((s) => s.characterPreset1),
    },
    {
      key: 'characterPreset2',
      value: settingsStore((s) => s.characterPreset2),
    },
    {
      key: 'characterPreset3',
      value: settingsStore((s) => s.characterPreset3),
    },
    {
      key: 'characterPreset4',
      value: settingsStore((s) => s.characterPreset4),
    },
    {
      key: 'characterPreset5',
      value: settingsStore((s) => s.characterPreset5),
    },
  ]
  const [tooltipText, setTooltipText] = useState('')

  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    visible: boolean
  }>({
    x: 0,
    y: 0,
    visible: false,
  })

  // ツールチップの縦のサイズの上限を20vhに設定
  const tooltipMaxHeight = '20vh'

  // ツールチップの表示位置を調整するための定数
  const tooltipOffsetX = 15
  const tooltipOffsetY = 10

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip({
      x: e.clientX + tooltipOffsetX,
      y: e.clientY + tooltipOffsetY,
      visible: true,
    })
  }

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    fetch('/api/get-vrm-list')
      .then((res) => res.json())
      .then((files) => setVrmFiles(files))
      .catch((error) => {
        console.error('Error fetching VRM list:', error)
      })

    fetch('/api/get-live2d-list')
      .then((res) => res.json())
      .then((models) => setLive2dModels(models))
      .catch((error) => {
        console.error('Error fetching Live2D list:', error)
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
      <div className="flex items-center mb-6">
        <Image
          src="/images/setting-icons/character-settings.svg"
          alt="Character Settings"
          width={24}
          height={24}
          className="mr-2"
        />
        <h2 className="text-2xl font-bold">{t('CharacterSettings')}</h2>
      </div>
      <div className="">
        <div className="mb-4 text-xl font-bold">{t('CharacterName')}</div>
        <input
          className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
          type="text"
          placeholder={t('CharacterName')}
          value={characterName}
          onChange={(e) =>
            settingsStore.setState({ characterName: e.target.value })
          }
        />

        <div className="mt-6 mb-4 text-xl font-bold">
          {t('CharacterModelLabel')}
        </div>
        <div className="mb-4 text-base">{t('CharacterModelInfo')}</div>

        <div className="flex mb-2">
          <button
            className={`px-4 py-2 rounded-lg mr-2 ${
              modelType === 'vrm'
                ? 'bg-primary text-white'
                : 'bg-white hover:bg-white-hover'
            }`}
            onClick={() => settingsStore.setState({ modelType: 'vrm' })}
          >
            VRM
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              modelType === 'live2d'
                ? 'bg-primary text-white'
                : 'bg-white hover:bg-white-hover'
            }`}
            onClick={() => settingsStore.setState({ modelType: 'live2d' })}
          >
            Live2D
          </button>
        </div>

        {modelType === 'vrm' ? (
          <>
            <select
              className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg"
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

            <div className="my-4">
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
          </>
        ) : (
          <>
            <div className="my-4 whitespace-pre-line">
              {t('Live2D.FileInfo')}
            </div>
            <select
              className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg mb-2"
              value={selectedLive2DPath}
              onChange={(e) => {
                const path = e.target.value
                settingsStore.setState({ selectedLive2DPath: path })
              }}
            >
              {live2dModels.map((model) => (
                <option key={model.path} value={model.path}>
                  {model.name}
                </option>
              ))}
            </select>

            {/* Cubism Core管理セクションを追加 */}
            <Live2DCubismCoreManager />

            <div className="my-4">
              <Live2DSettingsForm />
            </div>
          </>
        )}

        <div className="my-6 mb-2">
          <div className="my-4 text-xl font-bold">
            {t('CharacterSettingsPrompt')}
          </div>
          {selectAIService === 'dify' ? (
            <div className="my-4">{t('DifyInstruction')}</div>
          ) : (
            <div className="my-4 whitespace-pre-line">
              {t('CharacterSettingsInfo')}
            </div>
          )}
        </div>
        <div className="my-4 whitespace-pre-line">
          {t('CharacterpresetInfo')}
        </div>
        <div className="my-6 mb-2">
          <div className="flex flex-wrap gap-2 mb-4" role="tablist">
            {characterPresets.map(({ key, value }, index) => {
              const customNameKey =
                `customPresetName${index + 1}` as keyof Character
              const customName = settingsStore(
                (s) => s[customNameKey] as string
              )
              const selectedIndex = settingsStore((s) => s.selectedPresetIndex)
              const isSelected = selectedIndex === index

              return (
                <button
                  key={key}
                  onClick={() => {
                    // プリセット選択時に内容を表示し、systemPromptも更新
                    settingsStore.setState({
                      selectedPresetIndex: index,
                      systemPrompt: value,
                    })

                    toastStore.getState().addToast({
                      message: t('Toasts.PresetSwitching', {
                        presetName: customName,
                      }),
                      type: 'info',
                      tag: `character-preset-switching`,
                    })
                  }}
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      settingsStore.setState({
                        selectedPresetIndex: index,
                        systemPrompt: value,
                      })

                      toastStore.getState().addToast({
                        message: t('Toasts.PresetSwitching', {
                          presetName: customName,
                        }),
                        type: 'info',
                        tag: `character-preset-switching`,
                      })
                    }
                  }}
                  className={`px-4 py-2 rounded-md text-sm ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-surface1 hover:bg-surface1-hover text-gray-800 bg-white'
                  }`}
                >
                  {customName}
                </button>
              )
            })}
          </div>

          {characterPresets.map(({ key, value }, index) => {
            const customNameKey =
              `customPresetName${index + 1}` as keyof Character
            const customName = settingsStore((s) => s[customNameKey] as string)
            const selectedIndex = settingsStore((s) => s.selectedPresetIndex)
            const isSelected = selectedIndex === index

            if (!isSelected) return null

            return (
              <div key={key} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => {
                      settingsStore.setState({
                        [customNameKey]: e.target.value,
                      })
                    }}
                    aria-label={t('PresetNameLabel', {
                      defaultValue: 'Preset Name',
                    })}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm w-full"
                    placeholder={t(`Characterpreset${index + 1}`)}
                  />
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => {
                    const newValue = e.target.value
                    // システムプロンプトとプリセットの内容を同時に更新
                    settingsStore.setState({
                      systemPrompt: newValue,
                      [key]: newValue,
                    })
                  }}
                  aria-label={t('SystemPromptLabel', {
                    defaultValue: 'System Prompt',
                  })}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-md w-full h-64 text-sm"
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
export default Character
