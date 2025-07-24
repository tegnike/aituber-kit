import { useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'

export default function VrmViewer() {
  const { t } = useTranslation()
  const [isControlsVisible, setIsControlsVisible] = useState(false)
  const [isFixedPosition, setIsFixedPosition] = useState(false)

  useEffect(() => {
    setIsFixedPosition(settingsStore.getState().fixedCharacterPosition)

    const unsubscribe = settingsStore.subscribe((state) => {
      setIsFixedPosition(state.fixedCharacterPosition)
    })

    return unsubscribe
  }, [])

  const handleFixPosition = () => {
    const { viewer } = homeStore.getState()
    viewer.fixCameraPosition()
  }

  const handleUnfixPosition = () => {
    const { viewer } = homeStore.getState()
    viewer.unfixCameraPosition()
  }

  const handleResetPosition = () => {
    const { viewer } = homeStore.getState()
    viewer.resetCameraPosition()
  }

  const canvasRef = useCallback((canvas: HTMLCanvasElement) => {
    if (canvas) {
      const { viewer } = homeStore.getState()
      const { selectedVrmPath } = settingsStore.getState()
      viewer.setup(canvas)
      viewer.loadVrm(selectedVrmPath)

      // Drag and DropでVRMを差し替え
      canvas.addEventListener('dragover', function (event) {
        event.preventDefault()
      })

      canvas.addEventListener('drop', function (event) {
        event.preventDefault()

        const files = event.dataTransfer?.files
        if (!files) {
          return
        }

        const file = files[0]
        if (!file) {
          return
        }
        const file_type = file.name.split('.').pop()
        if (file_type === 'vrm') {
          const blob = new Blob([file], { type: 'application/octet-stream' })
          const url = window.URL.createObjectURL(blob)
          viewer.loadVrm(url)
        } else if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = function () {
            const image = reader.result as string
            image !== '' && homeStore.setState({ modalImage: image })
          }
        }
      })
    }
  }, [])

  return (
    <div
      className={'absolute top-0 left-0 w-screen h-[100svh] z-5'}
      onMouseEnter={() => setIsControlsVisible(true)}
      onMouseLeave={() => setIsControlsVisible(false)}
    >
      <canvas ref={canvasRef} className={'h-full w-full'}></canvas>

      {/* Character Position Controls */}
      <div
        className={`absolute top-4 right-4 transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="text-white text-sm font-medium">
            {t('CharacterPosition')}
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={
                isFixedPosition ? handleUnfixPosition : handleFixPosition
              }
              className={`px-3 py-1 text-xs rounded ${
                isFixedPosition
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isFixedPosition
                ? t('UnfixCharacterPosition')
                : t('FixCharacterPosition')}
            </button>
            <button
              onClick={handleResetPosition}
              className="px-3 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600"
            >
              {t('ResetCharacterPosition')}
            </button>
          </div>
          <div className="text-white text-xs opacity-80">
            {isFixedPosition
              ? t('CharacterPositionFixed')
              : t('DragCharacterToMove')}
          </div>
        </div>
      </div>
    </div>
  )
}
