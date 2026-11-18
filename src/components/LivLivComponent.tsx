'use client'

import type { Player } from '@livliv-dev/player'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { reportViewerError } from '@/components/common/ErrorBoundary'
import ModelLoadingOverlay from '@/components/modelLoadingOverlay'
import {
  applyLivLivExpression,
  bindLivLivMouth,
} from '@/features/livliv/livlivRuntime'
import {
  isLivLivFileName,
  reportLivLivModelError,
  resolveLivLivModel,
  selectLocalLivLivFile,
  useLocalLivLivRevision,
} from '@/features/livliv/models'
import homeStore from '@/features/stores/home'
import { logger } from '@/lib/logger'

function attachImage(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    const image = reader.result as string
    if (image) homeStore.setState({ modalImage: image })
  }
  reader.onerror = () => logger.error('Failed to read image file')
  reader.readAsDataURL(file)
}

export default function LivLivComponent({
  selectedPath,
}: {
  selectedPath: string
}) {
  const { t } = useTranslation()
  const revision = useLocalLivLivRevision()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [canvasVersion, setCanvasVersion] = useState(0)
  const [initError, setInitError] = useState<string | null>(null)
  const [settled, setSettled] = useState<{
    player: Player
    path: string
    revision: number
  } | null>(null)
  const hasModel = selectedPath !== ''

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasModel) return

    let cancelled = false
    let mountedPlayer: Player | undefined
    // コンテキストを失ったら、画面が見えているときに新しいキャンバスで作り直す。
    const recreate = () => {
      if (document.hidden) return
      document.removeEventListener('visibilitychange', recreate)
      setCanvasVersion((version) => version + 1)
    }

    void import('@livliv-dev/player')
      .then(({ Player, LivLivError }) => {
        if (cancelled) return

        try {
          const created = new Player(canvas, { followPointer: 'page' })
          mountedPlayer = created
          bindLivLivMouth(created)
          created.onContextLost = () => {
            setPlayer(null)
            if (document.hidden) {
              document.addEventListener('visibilitychange', recreate)
            } else {
              recreate()
            }
          }
          homeStore.setState({ livlivPlayer: created })
          setInitError(null)
          setPlayer(created)
        } catch (error) {
          if (error instanceof LivLivError && error.code === 'no-webgl') {
            setInitError('LivLiv.WebGLUnsupported')
          } else {
            throw error
          }
        }
      })
      .catch((error) => {
        if (cancelled) return
        setInitError('Errors.ViewerRenderingError')
        reportViewerError('livliv-viewer', error)
      })

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', recreate)
      if (!mountedPlayer) return
      mountedPlayer.onContextLost = undefined
      if (homeStore.getState().livlivPlayer === mountedPlayer) {
        homeStore.setState({ livlivPlayer: null })
      }
      // StrictMode とモデルの選択解除ではキャンバスが残り、次の Player が使う。
      mountedPlayer.dispose({ release: !canvas.isConnected })
      if (canvas.isConnected) setPlayer(null)
    }
  }, [canvasVersion, hasModel])

  useEffect(() => {
    if (!player || !selectedPath) return

    const controller = new AbortController()
    const { signal } = controller
    void resolveLivLivModel(selectedPath)
      .then(async (source) => {
        if (signal.aborted) return
        const model = await player.load(source, { signal })
        if (signal.aborted) return
        player.view.fit = model.fullBody ? 'knee' : 'frame'
        applyLivLivExpression(player)
      })
      .catch((error) => {
        if (!signal.aborted) reportLivLivModelError('LoadError', error)
      })
      .finally(() => {
        if (!signal.aborted) {
          setSettled({ player, path: selectedPath, revision })
        }
      })

    return () => controller.abort()
  }, [player, selectedPath, revision])

  const message = hasModel ? initError : 'LivLiv.NoModel'
  const loading =
    hasModel &&
    !initError &&
    (!settled ||
      settled.player !== player ||
      settled.path !== selectedPath ||
      settled.revision !== revision)

  return (
    <div
      className="relative h-full w-full"
      data-testid="livliv-stage"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        const file = event.dataTransfer.files[0]
        if (!file) return
        if (isLivLivFileName(file.name)) void selectLocalLivLivFile(file)
        else if (file.type.startsWith('image/')) attachImage(file)
      }}
    >
      <canvas
        key={canvasVersion}
        ref={canvasRef}
        className="h-full w-full"
        aria-label="LivLiv"
      />
      {message && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="max-w-md text-balance rounded-2xl bg-black/45 px-4 py-3 text-sm font-bold text-white">
            {t(message)}
          </p>
        </div>
      )}
      {loading && <ModelLoadingOverlay />}
    </div>
  )
}
