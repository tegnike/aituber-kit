import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore from '@/features/stores/settings'
import { SYSTEM_PROMPT } from '@/features/constants/systemPromptConstants'
import { TextButton } from '../textButton'

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
                  <div className="flex flex-wrap gap-4">
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
          <TextButton
            onClick={() =>
              settingsStore.setState({ systemPrompt: SYSTEM_PROMPT })
            }
          >
            {t('CharacterSettingsReset')}
          </TextButton>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) =>
            settingsStore.setState({ systemPrompt: e.target.value })
          }
          className="px-4 py-2 bg-white hover:bg-white-hover h-40 rounded-lg w-full"
        ></textarea>
      </div>
    </>
  )
}
export default Character
