import { useCallback, useEffect } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'

export default function VrmViewer() {
  // Ctrl+S でカメラ位置を保存してコンソールに出力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const { viewer } = homeStore.getState()
        viewer.saveCameraPosition()
        const { characterPosition, characterRotation } =
          settingsStore.getState()
        console.log('📍 Camera Position Saved:')
        console.log(JSON.stringify({ characterPosition, characterRotation }, null, 2))
        console.log(`
// .env に追加:
NEXT_PUBLIC_CHARACTER_POSITION_X=${characterPosition.x}
NEXT_PUBLIC_CHARACTER_POSITION_Y=${characterPosition.y}
NEXT_PUBLIC_CHARACTER_POSITION_Z=${characterPosition.z}
NEXT_PUBLIC_CHARACTER_ROTATION_X=${characterRotation.x}
NEXT_PUBLIC_CHARACTER_ROTATION_Y=${characterRotation.y}
NEXT_PUBLIC_CHARACTER_ROTATION_Z=${characterRotation.z}
`)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    <div className={'absolute top-0 left-0 w-screen h-[100svh] z-5'}>
      <canvas ref={canvasRef} className={'h-full w-full'}></canvas>
    </div>
  )
}
