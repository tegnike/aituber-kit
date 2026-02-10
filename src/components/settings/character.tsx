import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore, { SettingsState } from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import { TextButton } from '../textButton'
import { ToggleSwitch } from '../toggleSwitch'
import { useLive2DEnabled } from '@/hooks/useLive2DEnabled'

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
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('Live2D.EmotionInfo')}
        </div>
        <div className="space-y-4 text-sm">
          {emotionFields.map((field) => (
            <div key={field.key}>
              <label className="block mb-2 font-bold">
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
                          className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-lg mr-1"
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
                        <span className="">{expression}</span>
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
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('Live2D.MotionGroupsInfo')}
        </div>
        <div className="space-y-4">
          {motionFields.map((field) => (
            <div key={field.key}>
              <label className="block mb-2 font-bold">
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
                      className="py-4 px-8 hover:bg-primary hover:text-theme"
                    >
                      {motion}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
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
  const { t, i18n } = useTranslation()
  const { isLive2DEnabled } = useLive2DEnabled()
  const {
    characterName,
    selectedVrmPath,
    selectedLive2DPath,
    selectedPNGTuberPath,
    pngTuberSensitivity,
    pngTuberChromaKeyEnabled,
    pngTuberChromaKeyColor,
    pngTuberChromaKeyTolerance,
    modelType,
    fixedCharacterPosition,
    selectAIService,
    systemPrompt,
    characterPreset1,
    characterPreset2,
    characterPreset3,
    characterPreset4,
    characterPreset5,
    customPresetName1,
    customPresetName2,
    customPresetName3,
    customPresetName4,
    customPresetName5,
    selectedPresetIndex,
    lightingIntensity,
  } = settingsStore()
  const [vrmFiles, setVrmFiles] = useState<string[]>([])
  const [live2dModels, setLive2dModels] = useState<
    Array<{ path: string; name: string }>
  >([])
  const [pngTuberModels, setPngTuberModels] = useState<
    Array<{ path: string; name: string; videoFile?: string }>
  >([])

  // クロマキー用動画プレビュー
  const chromaKeyVideoRef = useRef<HTMLVideoElement>(null)
  const chromaKeyCanvasRef = useRef<HTMLCanvasElement>(null)
  const [chromaKeyVideoUrl, setChromaKeyVideoUrl] = useState<string>('')

  // 選択されたPNGTuberの動画URLを取得
  useEffect(() => {
    if (selectedPNGTuberPath && pngTuberModels.length > 0) {
      const selectedModel = pngTuberModels.find(
        (model) => model.path === selectedPNGTuberPath
      )
      if (selectedModel?.videoFile) {
        setChromaKeyVideoUrl(`${selectedModel.path}/${selectedModel.videoFile}`)
      }
    }
  }, [selectedPNGTuberPath, pngTuberModels])

  // 動画クリックで色を取得
  const handleVideoClick = useCallback(
    (e: React.MouseEvent<HTMLVideoElement>) => {
      const video = chromaKeyVideoRef.current
      const canvas = chromaKeyCanvasRef.current
      if (!video || !canvas) return

      const rect = video.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // キャンバスサイズを動画に合わせる
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 動画の現在フレームをキャンバスに描画
      ctx.drawImage(video, 0, 0)

      // クリック位置を動画座標に変換
      const scaleX = video.videoWidth / rect.width
      const scaleY = video.videoHeight / rect.height
      const videoX = Math.floor(x * scaleX)
      const videoY = Math.floor(y * scaleY)

      // ピクセルの色を取得
      const pixel = ctx.getImageData(videoX, videoY, 1, 1).data
      const hexColor = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`

      settingsStore.setState({ pngTuberChromaKeyColor: hexColor })
    },
    []
  )

  const characterPresets = [
    {
      key: 'characterPreset1',
      value: characterPreset1,
    },
    {
      key: 'characterPreset2',
      value: characterPreset2,
    },
    {
      key: 'characterPreset3',
      value: characterPreset3,
    },
    {
      key: 'characterPreset4',
      value: characterPreset4,
    },
    {
      key: 'characterPreset5',
      value: characterPreset5,
    },
  ]

  const customPresetNames = [
    customPresetName1,
    customPresetName2,
    customPresetName3,
    customPresetName4,
    customPresetName5,
  ]

  useEffect(() => {
    fetch('/api/get-vrm-list')
      .then((res) => res.json())
      .then((files) => setVrmFiles(files))
      .catch((error) => {
        console.error('Error fetching VRM list:', error)
      })

    if (isLive2DEnabled) {
      fetch('/api/get-live2d-list')
        .then((res) => res.json())
        .then((models) => setLive2dModels(models))
        .catch((error) => {
          console.error('Error fetching Live2D list:', error)
        })
    }

    fetch('/api/get-pngtuber-list')
      .then((res) => res.json())
      .then((models) => setPngTuberModels(models))
      .catch((error) => {
        console.error('Error fetching PNGTuber list:', error)
      })
  }, [])
  const handlePositionAction = (action: 'fix' | 'unfix' | 'reset') => {
    try {
      const { viewer, live2dViewer } = homeStore.getState()

      if (modelType === 'vrm') {
        const methodMap = {
          fix: 'fixCameraPosition',
          unfix: 'unfixCameraPosition',
          reset: 'resetCameraPosition',
        }
        const method = methodMap[action]
        if (viewer && typeof (viewer as any)[method] === 'function') {
          ;(viewer as any)[method]()
        } else {
          throw new Error(`VRM viewer method ${method} not available`)
        }
      } else if (live2dViewer) {
        const methodMap = {
          fix: 'fixPosition',
          unfix: 'unfixPosition',
          reset: 'resetPosition',
        }
        const method = methodMap[action]
        if (typeof (live2dViewer as any)[method] === 'function') {
          ;(live2dViewer as any)[method]()
        } else {
          throw new Error(`Live2D viewer method ${method} not available`)
        }
      }

      const messageMap = {
        fix: t('Toasts.PositionFixed'),
        unfix: t('Toasts.PositionUnfixed'),
        reset: t('Toasts.PositionReset'),
      }

      toastStore.getState().addToast({
        message: messageMap[action],
        type: action === 'fix' ? 'success' : 'info',
        tag: `position-${action}`,
      })
    } catch (error) {
      console.error(`Position ${action} failed:`, error)
      toastStore.getState().addToast({
        message: t('Toasts.PositionActionFailed'),
        type: 'error',
        tag: 'position-error',
      })
    }
  }

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
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('CharacterModelInfo')}
        </div>

        <div className="flex mb-2">
          <button
            className={`px-4 py-2 rounded-lg mr-2 ${
              modelType === 'vrm'
                ? 'bg-primary text-theme'
                : 'bg-white hover:bg-white-hover'
            }`}
            onClick={() => settingsStore.setState({ modelType: 'vrm' })}
          >
            VRM
          </button>
          {isLive2DEnabled && (
            <button
              className={`px-4 py-2 rounded-lg mr-2 ${
                modelType === 'live2d'
                  ? 'bg-primary text-theme'
                  : 'bg-white hover:bg-white-hover'
              }`}
              onClick={() => settingsStore.setState({ modelType: 'live2d' })}
            >
              Live2D
            </button>
          )}
          <button
            className={`px-4 py-2 rounded-lg ${
              modelType === 'pngtuber'
                ? 'bg-primary text-theme'
                : 'bg-white hover:bg-white-hover'
            }`}
            onClick={() => settingsStore.setState({ modelType: 'pngtuber' })}
          >
            {i18n.language === 'ja' ? '動くPNGTuber' : 'MotionPNGTuber'}
          </button>
        </div>

        {modelType === 'vrm' && (
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
        )}

        {modelType === 'live2d' && isLive2DEnabled && (
          <>
            <div className="my-2 text-sm whitespace-pre-wrap">
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

        {modelType === 'pngtuber' && (
          <>
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('PNGTuber.FileInfo')}
            </div>
            <div className="my-2 text-sm">
              {i18n.language === 'ja'
                ? 'アセットの作成方法は '
                : 'For asset creation, see '}
              <a
                href="https://github.com/rotejin/MotionPNGTuber"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://github.com/rotejin/MotionPNGTuber
              </a>
              {i18n.language === 'ja' ? ' を参照してください。' : '.'}
            </div>
            <select
              className="text-ellipsis px-4 py-2 w-col-span-2 bg-white hover:bg-white-hover rounded-lg mb-2"
              value={selectedPNGTuberPath}
              onChange={(e) => {
                const path = e.target.value
                settingsStore.setState({ selectedPNGTuberPath: path })
              }}
            >
              {pngTuberModels.map((model) => (
                <option key={model.path} value={model.path}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="my-4">
              <div className="font-bold">
                {t('PNGTuber.Sensitivity')}: {pngTuberSensitivity}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={pngTuberSensitivity}
                onChange={(e) => {
                  settingsStore.setState({
                    pngTuberSensitivity: parseInt(e.target.value),
                  })
                }}
                className="mt-2 mb-4 input-range"
              />
              <div className="text-sm text-gray-600">
                {t('PNGTuber.SensitivityInfo')}
              </div>
            </div>

            {/* クロマキー設定 */}
            <div className="my-6">
              <div className="my-4 font-bold">{t('PNGTuber.ChromaKey')}</div>
              <div className="my-2">
                <ToggleSwitch
                  enabled={pngTuberChromaKeyEnabled}
                  onChange={(v) =>
                    settingsStore.setState({
                      pngTuberChromaKeyEnabled: v,
                    })
                  }
                />
              </div>

              {pngTuberChromaKeyEnabled && (
                <>
                  {/* 動画プレビュー */}
                  {chromaKeyVideoUrl && (
                    <div className="mb-4">
                      <div className="font-bold mb-2">
                        {t('PNGTuber.ChromaKeyPreview')}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {t('PNGTuber.ChromaKeyPreviewInfo')}
                      </div>
                      <div className="relative inline-block">
                        <video
                          ref={chromaKeyVideoRef}
                          src={chromaKeyVideoUrl}
                          className="max-w-full h-auto max-h-48 rounded-lg cursor-crosshair border border-gray-300"
                          autoPlay
                          loop
                          muted
                          playsInline
                          onClick={handleVideoClick}
                        />
                        <canvas ref={chromaKeyCanvasRef} className="hidden" />
                      </div>
                    </div>
                  )}

                  {/* カラーピッカー */}
                  <div className="mb-4">
                    <div className="font-bold mb-2">
                      {t('PNGTuber.ChromaKeyColor')}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pngTuberChromaKeyColor}
                        onChange={(e) =>
                          settingsStore.setState({
                            pngTuberChromaKeyColor: e.target.value,
                          })
                        }
                        className="h-10 w-16 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pngTuberChromaKeyColor}
                        onChange={(e) =>
                          settingsStore.setState({
                            pngTuberChromaKeyColor: e.target.value,
                          })
                        }
                        className="px-2 py-1 w-24 bg-white rounded-lg border"
                        placeholder="#00FF00"
                      />
                    </div>
                  </div>

                  {/* 許容値スライダー */}
                  <div>
                    <div className="font-bold">
                      {t('PNGTuber.ChromaKeyTolerance')}:{' '}
                      {pngTuberChromaKeyTolerance}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      step="1"
                      value={pngTuberChromaKeyTolerance}
                      onChange={(e) =>
                        settingsStore.setState({
                          pngTuberChromaKeyTolerance: parseInt(e.target.value),
                        })
                      }
                      className="mt-2 mb-4 input-range"
                    />
                    <div className="text-sm text-gray-600">
                      {t('PNGTuber.ChromaKeyToleranceInfo')}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 位置・サイズリセットボタン */}
            <div className="my-6">
              <div className="font-bold mb-2">{t('PNGTuber.PositionSize')}</div>
              <div className="text-sm text-gray-600 mb-4">
                {t('PNGTuber.PositionInfo')}
              </div>
              <TextButton
                onClick={() => {
                  settingsStore.setState({
                    pngTuberScale: 1.0,
                    pngTuberOffsetX: 0,
                    pngTuberOffsetY: 0,
                  })
                }}
              >
                {t('PNGTuber.ResetPosition')}
              </TextButton>
            </div>
          </>
        )}

        {/* Character Position Controls - VRM/Live2D only (PNGTuber uses scale/offset in viewer) */}
        {modelType !== 'pngtuber' && (
          <div className="my-6">
            <div className="text-xl font-bold mb-4">
              {t('CharacterPosition')}
            </div>
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('CharacterPositionInfo')}
            </div>
            <div className="mb-2 text-sm font-medium">
              {t('CurrentStatus')}:{' '}
              <span className="font-bold">
                {fixedCharacterPosition
                  ? t('PositionFixed')
                  : t('PositionNotFixed')}
              </span>
            </div>
            <div className="flex gap-4 md:flex-row flex-col">
              <button
                onClick={() => handlePositionAction('fix')}
                className="px-4 py-3 text-theme font-medium bg-primary hover:bg-primary-hover active:bg-primary-press rounded-lg transition-colors duration-200 md:rounded-full md:px-6 md:py-2"
              >
                {t('FixPosition')}
              </button>
              <button
                onClick={() => handlePositionAction('unfix')}
                className="px-4 py-3 text-theme font-medium bg-primary hover:bg-primary-hover active:bg-primary-press rounded-lg transition-colors duration-200 md:rounded-full md:px-6 md:py-2"
              >
                {t('UnfixPosition')}
              </button>
              <button
                onClick={() => handlePositionAction('reset')}
                className="px-4 py-3 text-theme font-medium bg-primary hover:bg-primary-hover active:bg-primary-press rounded-lg transition-colors duration-200 md:rounded-full md:px-6 md:py-2"
              >
                {t('ResetPosition')}
              </button>
            </div>
          </div>
        )}

        {/* VRM Lighting Controls */}
        {modelType === 'vrm' && (
          <div className="my-6">
            <div className="text-xl font-bold mb-4">照明の強度</div>
            <div className="mb-4">
              VRMキャラクターの照明の明るさを調整します。
            </div>
            <div className="font-bold">
              照明の強度: {lightingIntensity.toFixed(1)}
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={lightingIntensity}
              onChange={(e) => {
                const intensity = parseFloat(e.target.value)
                settingsStore.setState({ lightingIntensity: intensity })
                const { viewer } = homeStore.getState()
                if (
                  viewer &&
                  typeof viewer.updateLightingIntensity === 'function'
                ) {
                  viewer.updateLightingIntensity(intensity)
                }
              }}
              className="mt-2 mb-4 input-range"
            />
          </div>
        )}

        <div className="border-t border-gray-300 pt-6 my-6 mb-2">
          <div className="my-4 text-xl font-bold">
            {t('CharacterSettingsPrompt')}
          </div>
          {selectAIService === 'dify' ? (
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('DifyInstruction')}
            </div>
          ) : (
            <div className="my-2 text-sm whitespace-pre-wrap">
              {t('CharacterSettingsInfo')}
            </div>
          )}
        </div>
        <div className="my-2 text-sm whitespace-pre-wrap">
          {t('CharacterpresetInfo')}
        </div>
        <div className="my-6 mb-2">
          <div className="flex flex-wrap gap-2 mb-4" role="tablist">
            {characterPresets.map(({ key, value }, index) => {
              const customName = customPresetNames[index]
              const isSelected = selectedPresetIndex === index

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
                      ? 'bg-primary text-theme'
                      : 'bg-surface1 hover:bg-surface1-hover text-gray-800 bg-white'
                  }`}
                >
                  {customName}
                </button>
              )
            })}
          </div>

          {characterPresets.map(({ key }, index) => {
            const customNameKey =
              `customPresetName${index + 1}` as keyof Character
            const customName = customPresetNames[index]
            const isSelected = selectedPresetIndex === index

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
