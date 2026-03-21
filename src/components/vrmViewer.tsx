import { useCallback } from 'react'

import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation'
import PoseTestButton from '@/components/poseTestButton'
import { useIsMobileLayout } from '@/hooks/useIsMobileLayout'
import { useIsDedicatedMobileWindow } from '@/hooks/useIsDedicatedMobileWindow'

export default function VrmViewer() {
  const chatLogWidth = settingsStore((s) => s.chatLogWidth)
  const isMobileLayout = useIsMobileLayout()
  const isDedicatedMobileWindow = useIsDedicatedMobileWindow()

  const canvasRef = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        const { viewer } = homeStore.getState()
        const { selectedVrmPath } = settingsStore.getState()

        viewer.setMobileInteractionMode(
          isMobileLayout && !isDedicatedMobileWindow
        )
        viewer.setup(canvas)
        viewer.unfixCameraPosition()
        viewer.setControlsEnabled(true)
        if (isDedicatedMobileWindow) {
          viewer.resetCamera()
        }
        viewer.loadVrm(selectedVrmPath)

        // Drag and Drop邵ｺ・ｧVRM郢ｧ雋橸ｽｷ・ｮ邵ｺ邇ｲ蟠帷ｸｺ繝ｻ
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
          } else if (file_type === 'vrma') {
            const blob = new Blob([file], { type: 'application/octet-stream' })
            const url = window.URL.createObjectURL(blob)
            loadVRMAnimation(url)
              .then((vrma) => {
                if (vrma) viewer.model?.loadAnimation(vrma)
              })
              .catch((error) => {
                console.error('Failed to load VRMA:', error)
              })
              .finally(() => URL.revokeObjectURL(url))
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
    },
    [isMobileLayout, isDedicatedMobileWindow]
  )

  const poseAdjustMode = settingsStore((s) => s.poseAdjustMode)

  return (
    <>
      <div
        className={'absolute top-0 h-[100svh] z-5'}
        data-no-window-drag="true"
        style={{
          left: isMobileLayout ? '0px' : `${chatLogWidth}px`,
          width: isMobileLayout ? '100vw' : `calc(100vw - ${chatLogWidth}px)`,
        }}
      >
        <canvas ref={canvasRef} className={'h-full w-full'}></canvas>
      </div>
      {poseAdjustMode && <PoseTestButton />}
    </>
  )
}
