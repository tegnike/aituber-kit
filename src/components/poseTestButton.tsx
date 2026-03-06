import { useState, useRef, useCallback, useEffect } from 'react'
import homeStore from '@/features/stores/home'
import settingsStore from '@/features/stores/settings'
import type { PoseConfigItem } from '@/features/stores/settings'
import toastStore from '@/features/stores/toast'
import { buildUrl } from '@/utils/buildUrl'

function usePoseToggle() {
  const [activePose, setActivePose] = useState<string | null>(null)

  const applyPose = useCallback(
    async (poseName: string, poseConfig: PoseConfigItem) => {
      const { viewer } = homeStore.getState()
      const model = viewer.model
      if (!model?.vrm || !model.mixer) return

      // 既に同じポーズならidleに戻す
      if (activePose === poseName) {
        resetToIdle()
        return
      }

      await model.poseManager.applyPose(model, poseName, poseConfig)
      setActivePose(poseName)
    },
    [activePose]
  )

  const resetToIdle = useCallback(() => {
    const { viewer } = homeStore.getState()
    const model = viewer.model
    if (!model?.mixer) return

    model.poseManager.resetToIdle(model)
    setActivePose(null)
  }, [])

  return { activePose, applyPose, resetToIdle }
}

async function fetchCurrentOffset(jsonPath: string): Promise<number> {
  try {
    const res = await fetch(buildUrl(jsonPath))
    const json = await res.json()
    return json.yRotationOffsetDeg ?? 0
  } catch {
    return 0
  }
}

export default function PoseTestButton() {
  const { activePose, applyPose, resetToIdle } = usePoseToggle()
  const poseConfigs = settingsStore((s) => s.poseConfigs)
  const [angleDeg, setAngleDeg] = useState(0)
  const [savedAngleDeg, setSavedAngleDeg] = useState(0)
  const [saving, setSaving] = useState(false)

  // スライダー変更時: 保存済み値との差分だけModel側のオフセットに反映
  const handleAngleChange = useCallback(
    (deg: number) => {
      setAngleDeg(deg)
      const { viewer } = homeStore.getState()
      if (viewer.model) {
        const diffRad = ((deg - savedAngleDeg) * Math.PI) / 180
        viewer.model.poseYRotationOffset = diffRad
      }
    },
    [savedAngleDeg]
  )

  const handlePoseClick = useCallback(
    async (poseConfig: PoseConfigItem) => {
      if ('json' in poseConfig) {
        const currentOffset = await fetchCurrentOffset(poseConfig.json)
        setAngleDeg(currentOffset)
        setSavedAngleDeg(currentOffset)
      } else {
        setAngleDeg(0)
        setSavedAngleDeg(0)
      }
      const { viewer } = homeStore.getState()
      if (viewer.model) {
        viewer.model.poseYRotationOffset = 0
      }
      applyPose(poseConfig.id, poseConfig)
    },
    [applyPose]
  )

  const handleSave = useCallback(async () => {
    const pose = poseConfigs.find((p) => p.id === activePose)
    if (!pose || !('json' in pose)) return

    setSaving(true)
    try {
      const res = await fetch('/api/update-pose-rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonPath: pose.json, angleDeg }),
      })

      if (res.ok) {
        toastStore.getState().addToast({
          message: `${pose.id}: Y軸 ${angleDeg > 0 ? '+' : ''}${angleDeg}° 保存完了`,
          type: 'success',
          tag: 'pose-rotation-save',
        })
        setSavedAngleDeg(angleDeg)
        const { viewer } = homeStore.getState()
        if (viewer.model) {
          viewer.model.poseYRotationOffset = 0
        }
        // JSONが更新されたのでポーズを再読み込み
        await applyPose('__reload__', pose)
        await applyPose(pose.id, pose)
      } else {
        toastStore.getState().addToast({
          message: '保存に失敗しました',
          type: 'error',
          tag: 'pose-rotation-save',
        })
      }
    } catch (e) {
      console.error('Failed to save pose rotation:', e)
      toastStore.getState().addToast({
        message: '保存に失敗しました',
        type: 'error',
        tag: 'pose-rotation-save',
      })
    } finally {
      setSaving(false)
    }
  }, [activePose, angleDeg, applyPose, poseConfigs])

  // コンポーネントアンマウント時（設定でOFFにした時）にidleに戻す
  const resetToIdleRef = useRef(resetToIdle)
  resetToIdleRef.current = resetToIdle
  useEffect(() => {
    return () => resetToIdleRef.current()
  }, [])

  return (
    <div className="fixed top-0 right-0 bottom-0 z-50 flex items-center">
      <div className="flex gap-3 mr-4">
        {/* 調整パネル（シーケンスでない通常ポーズのみ表示） */}
        {activePose &&
          poseConfigs.find((p) => p.id === activePose && 'json' in p) && (
            <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-4 text-white shadow-xl w-64 self-center">
              <div className="text-sm font-bold mb-2">
                Y軸回転: {angleDeg > 0 ? '+' : ''}
                {angleDeg.toFixed(1)}°
                {angleDeg !== savedAngleDeg && (
                  <span className="ml-2 text-yellow-300 text-xs">未保存</span>
                )}
              </div>
              <input
                type="range"
                min="-15"
                max="15"
                step="0.1"
                value={angleDeg}
                onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
                className="w-full mb-2 accent-white"
              />
              <div className="flex justify-between text-xs text-gray-400 mb-3">
                <span>-15°</span>
                <span>0°</span>
                <span>+15°</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAngleChange(savedAngleDeg)}
                  className="flex-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs"
                >
                  元に戻す
                </button>
                <button
                  onClick={handleSave}
                  disabled={angleDeg === savedAngleDeg || saving}
                  className="flex-1 px-3 py-1.5 bg-primary hover:bg-primary-hover rounded-lg text-xs disabled:opacity-40"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}

        {/* ポーズボタン群（縦並び） */}
        <div className="flex flex-col gap-2">
          {poseConfigs.map((pose) => (
            <button
              key={pose.id}
              onClick={() => handlePoseClick(pose)}
              className={`rounded-xl px-4 py-2 font-bold text-white shadow-lg text-sm ${
                activePose === pose.id
                  ? 'bg-secondary hover:bg-secondary-hover'
                  : 'bg-primary hover:bg-primary-hover active:bg-primary-press'
              }`}
            >
              {activePose === pose.id ? 'Idle' : pose.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
