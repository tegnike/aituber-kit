import { useState, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import homeStore from '@/features/stores/home'
import toastStore from '@/features/stores/toast'
import { createSequenceClip } from '@/lib/VRMAnimation/createSequenceClip'
import { loadPoseFromJSON } from '@/lib/VRMAnimation/loadPoseFromJSON'
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation'
import { buildUrl } from '@/utils/buildUrl'

const FADE_DURATION = 0.5

interface PoseState {
  poseAction: THREE.AnimationAction
  additiveAction: THREE.AnimationAction
}

function usePoseToggle() {
  const [activePose, setActivePose] = useState<string | null>(null)
  const poseStateRef = useRef<PoseState | null>(null)

  const applyPose = useCallback(
    async (poseName: string, poseConfig: PoseConfig) => {
      const { viewer } = homeStore.getState()
      const model = viewer.model
      if (!model?.vrm || !model.mixer) return

      // 既に同じポーズならidleに戻す
      if (activePose === poseName) {
        resetToIdle()
        return
      }

      // 別のポーズ中ならまずそれをクリア
      if (poseStateRef.current) {
        poseStateRef.current.poseAction.fadeOut(FADE_DURATION)
        poseStateRef.current.additiveAction.fadeOut(FADE_DURATION)
      }

      const isSequence = 'sequence' in poseConfig
      let poseClip: THREE.AnimationClip

      if (isSequence) {
        const [poses, idleVrma] = await Promise.all([
          Promise.all(
            poseConfig.sequence.map((p) => loadPoseFromJSON(buildUrl(p)))
          ),
          loadVRMAnimation(buildUrl('/idle_loop.vrma')),
        ])
        if (poses.some((p) => !p) || !idleVrma) return

        poseClip = createSequenceClip(
          poses.filter((p): p is NonNullable<typeof p> => p !== null),
          model.vrm,
          poseConfig.switchDuration ?? 0.5
        )
        const hipsNode = model.vrm.humanoid.getNormalizedBoneNode('hips')
        if (hipsNode) {
          const pos = hipsNode.position
          poseClip.tracks.push(
            new THREE.VectorKeyframeTrack(
              `${hipsNode.name}.position`,
              [0],
              [pos.x, pos.y, pos.z]
            )
          )
        }
        poseClip.name = `sequence_${poseName}`
        const poseAction = model.mixer.clipAction(poseClip)
        poseAction.loop = THREE.LoopRepeat

        const additiveClip = idleVrma.createAnimationClip(model.vrm)
        THREE.AnimationUtils.makeClipAdditive(additiveClip)
        if (hipsNode) {
          additiveClip.tracks = additiveClip.tracks.filter(
            (track) => track.name !== `${hipsNode.name}.position`
          )
        }
        additiveClip.name = `idle_additive_${poseName}`
        const additiveAction = model.mixer.clipAction(additiveClip)
        additiveAction.blendMode = THREE.AdditiveAnimationBlendMode

        if (!poseStateRef.current && model.currentAction) {
          model.currentAction.fadeOut(FADE_DURATION)
        }

        poseAction.reset().fadeIn(FADE_DURATION).play()
        additiveAction.reset().fadeIn(FADE_DURATION).play()

        poseStateRef.current = { poseAction, additiveAction }
        setActivePose(poseName)
      } else {
        const [pose, idleVrma] = await Promise.all([
          loadPoseFromJSON(buildUrl(poseConfig.json)),
          loadVRMAnimation(buildUrl('/idle_loop.vrma')),
        ])
        if (!pose || !idleVrma) return

        poseClip = pose.createAnimationClip(model.vrm)
        const hipsNode = model.vrm.humanoid.getNormalizedBoneNode('hips')
        if (hipsNode) {
          const pos = hipsNode.position
          poseClip.tracks.push(
            new THREE.VectorKeyframeTrack(
              `${hipsNode.name}.position`,
              [0],
              [pos.x, pos.y, pos.z]
            )
          )
        }
        poseClip.name = `pose_${poseName}`
        const poseAction = model.mixer.clipAction(poseClip)

        const additiveClip = idleVrma.createAnimationClip(model.vrm)
        THREE.AnimationUtils.makeClipAdditive(additiveClip)
        if (hipsNode) {
          additiveClip.tracks = additiveClip.tracks.filter(
            (track) => track.name !== `${hipsNode.name}.position`
          )
        }
        additiveClip.name = `idle_additive_${poseName}`
        const additiveAction = model.mixer.clipAction(additiveClip)
        additiveAction.blendMode = THREE.AdditiveAnimationBlendMode

        if (!poseStateRef.current && model.currentAction) {
          model.currentAction.fadeOut(FADE_DURATION)
        }

        poseAction.reset().fadeIn(FADE_DURATION).play()
        additiveAction.reset().fadeIn(FADE_DURATION).play()

        poseStateRef.current = { poseAction, additiveAction }
        setActivePose(poseName)
      }
    },
    [activePose]
  )

  const resetToIdle = useCallback(() => {
    const { viewer } = homeStore.getState()
    const model = viewer.model
    if (!model?.mixer) return

    model.poseYRotationOffset = 0

    if (poseStateRef.current) {
      poseStateRef.current.poseAction.fadeOut(FADE_DURATION)
      poseStateRef.current.additiveAction.fadeOut(FADE_DURATION)
      poseStateRef.current = null
    }
    if (model.currentAction) {
      model.currentAction.reset().fadeIn(FADE_DURATION).play()
    }
    setActivePose(null)
  }, [])

  return { activePose, applyPose, resetToIdle }
}

type PoseConfig =
  | { name: string; label: string; json: string }
  | {
      name: string
      label: string
      sequence: string[]
      switchDuration?: number
    }

const POSES: PoseConfig[] = [
  { name: 'think', label: 'Think', json: '/think.json' },
  { name: 'cheer', label: 'Cheer', json: '/cheer.json' },
  { name: 'cross', label: 'Cross', json: '/cross.json' },
  { name: 'cover_mouth', label: 'Cover Mouth', json: '/cover_mouth.json' },
  { name: 'finger_touch', label: 'Finger Touch', json: '/finger_touch.json' },
  {
    name: 'wave',
    label: 'Wave',
    sequence: ['/wave1.json', '/wave2.json'],
    switchDuration: 0.5,
  },
]

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
    async (poseConfig: PoseConfig) => {
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
      applyPose(poseConfig.name, poseConfig)
    },
    [applyPose]
  )

  const handleSave = useCallback(async () => {
    const pose = POSES.find((p) => p.name === activePose)
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
          message: `${pose.label}: Y軸 ${angleDeg > 0 ? '+' : ''}${angleDeg}° 保存完了`,
          type: 'success',
          tag: 'pose-rotation-save',
        })
        setSavedAngleDeg(angleDeg)
        const { viewer } = homeStore.getState()
        if (viewer.model) {
          viewer.model.poseYRotationOffset = 0
        }
        // JSONが更新されたのでポーズを再読み込み
        applyPose('__reload__', pose)
        setTimeout(() => applyPose(pose.name, pose), 100)
      } else {
        toastStore.getState().addToast({
          message: '保存に失敗しました',
          type: 'error',
          tag: 'pose-rotation-save',
        })
      }
    } finally {
      setSaving(false)
    }
  }, [activePose, angleDeg, applyPose])

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
          POSES.find((p) => p.name === activePose && 'json' in p) && (
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
          {POSES.map((pose) => (
            <button
              key={pose.name}
              onClick={() => handlePoseClick(pose)}
              className={`rounded-xl px-4 py-2 font-bold text-white shadow-lg text-sm ${
                activePose === pose.name
                  ? 'bg-secondary hover:bg-secondary-hover'
                  : 'bg-primary hover:bg-primary-hover active:bg-primary-press'
              }`}
            >
              {activePose === pose.name ? 'Idle' : pose.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
