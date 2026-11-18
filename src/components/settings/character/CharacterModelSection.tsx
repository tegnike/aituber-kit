import { logger } from '@/lib/logger'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import menuStore from '@/features/stores/menu'
import settingsStore, { SettingsState } from '@/features/stores/settings'
import { TextButton } from '../../textButton'
import { ToggleSwitch } from '../../toggleSwitch'
import { useLive2DEnabled } from '@/hooks/useLive2DEnabled'
import { useRestrictedMode } from '@/hooks/useRestrictedMode'
import { Live2DSettingsForm } from './Live2DSettingsForm'
import { LivLivModelSettings } from './LivLivModelSettings'
import { settingsControlClass } from '@/components/settings/formStyles'

interface CharacterModelSectionProps {
  modelType: SettingsState['modelType']
  selectedVrmPath: string
  selectedLive2DPath: string
  selectedPNGTuberPath: string
  pngTuberSensitivity: number
  pngTuberChromaKeyEnabled: boolean
  pngTuberChromaKeyColor: string
  pngTuberChromaKeyTolerance: number
}

export const CharacterModelSection = ({
  modelType,
  selectedVrmPath,
  selectedLive2DPath,
  selectedPNGTuberPath,
  pngTuberSensitivity,
  pngTuberChromaKeyEnabled,
  pngTuberChromaKeyColor,
  pngTuberChromaKeyTolerance,
}: CharacterModelSectionProps) => {
  const { t, i18n } = useTranslation()
  const { isLive2DEnabled } = useLive2DEnabled()
  const { isRestrictedMode } = useRestrictedMode()
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

  useEffect(() => {
    fetch('/api/get-vrm-list')
      .then((res) => res.json())
      .then((files) => setVrmFiles(files))
      .catch((error) => {
        logger.error('Error fetching VRM list:', error)
      })

    if (isLive2DEnabled) {
      fetch('/api/get-live2d-list')
        .then((res) => res.json())
        .then((models) => setLive2dModels(models))
        .catch((error) => {
          logger.error('Error fetching Live2D list:', error)
        })
    }

    fetch('/api/get-pngtuber-list')
      .then((res) => res.json())
      .then((models) => setPngTuberModels(models))
      .catch((error) => {
        logger.error('Error fetching PNGTuber list:', error)
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
          logger.error('Error fetching VRM list:', error)
        })
    }
  }

  return (
    <>
      <div className="mt-6 mb-4 text-xl font-bold">
        {t('CharacterModelLabel')}
      </div>
      <div className="my-2 text-sm whitespace-pre-wrap">
        {t('CharacterModelInfo')}
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-lg ${
            modelType === 'vrm'
              ? 'bg-primary text-theme'
              : 'bg-white hover:bg-white-hover'
          }`}
          onClick={() => settingsStore.setState({ modelType: 'vrm' })}
        >
          VRM
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            modelType === 'live2d'
              ? 'bg-primary text-theme'
              : 'bg-white hover:bg-white-hover'
          }`}
          onClick={() => settingsStore.setState({ modelType: 'live2d' })}
        >
          Live2D
        </button>
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
        <button
          className={`px-4 py-2 rounded-lg ${
            modelType === 'livliv'
              ? 'bg-primary text-theme'
              : 'bg-white hover:bg-white-hover'
          }`}
          onClick={() => settingsStore.setState({ modelType: 'livliv' })}
        >
          LivLiv
        </button>
      </div>

      {modelType === 'vrm' && (
        <>
          <select
            className={settingsControlClass.medium}
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
              disabled={isRestrictedMode}
            >
              {t('OpenVRM')}
            </TextButton>
          </div>
        </>
      )}

      {modelType === 'live2d' && !isLive2DEnabled && (
        <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm whitespace-pre-wrap text-yellow-800">
            {t('Live2D.SetupInfo')}
          </div>
        </div>
      )}

      {modelType === 'live2d' && isLive2DEnabled && (
        <>
          <div className="my-2 text-sm whitespace-pre-wrap">
            {t('Live2D.FileInfo')}
          </div>
          <select
            className={`${settingsControlClass.medium} mb-2`}
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

      {modelType === 'livliv' && <LivLivModelSettings />}

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
            className={`${settingsControlClass.medium} mb-2`}
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
    </>
  )
}
