import { useState, useRef, useCallback } from 'react'
import * as THREE from 'three'
import homeStore from '@/features/stores/home'
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

  const applyPose = useCallback(async (poseName: string, jsonPath: string) => {
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

    const [pose, idleVrma] = await Promise.all([
      loadPoseFromJSON(buildUrl(jsonPath)),
      loadVRMAnimation(buildUrl('/idle_loop.vrma')),
    ])
    if (!pose || !idleVrma) return

    // ポーズclip作成 + hips位置焼き込み
    const poseClip = pose.createAnimationClip(model.vrm)
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

    // idle_loopのadditive版（揺れだけ加算）
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

    // 元のidleをfadeOut（別ポーズからの切り替え時はすでにfadeOut済み）
    if (!poseStateRef.current && model.currentAction) {
      model.currentAction.fadeOut(FADE_DURATION)
    }

    poseAction.reset().fadeIn(FADE_DURATION).play()
    additiveAction.reset().fadeIn(FADE_DURATION).play()

    poseStateRef.current = { poseAction, additiveAction }
    setActivePose(poseName)
  }, [activePose])

  const resetToIdle = useCallback(() => {
    const { viewer } = homeStore.getState()
    const model = viewer.model
    if (!model?.mixer) return

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

const POSES = [
  { name: 'think', label: 'Think', json: '/think.json' },
  { name: 'cheer', label: 'Cheer', json: '/cheer.json' },
  { name: 'cross', label: 'Cross', json: '/cross.json' },
  { name: 'cover_mouth', label: 'Cover Mouth', json: '/cover_mouth.json' },
  { name: 'finger_touch', label: 'Finger Touch', json: '/finger_touch.json' },
  { name: 'wave1', label: 'Wave 1', json: '/wave1.json' },
  { name: 'wave1_bk', label: 'Wave 1 BK', json: '/wave1_bk.json' },
  { name: 'wave2', label: 'Wave 2', json: '/wave2.json' },
  { name: 'wave2_bk', label: 'Wave 2 BK', json: '/wave2_bk.json' },
]

export default function PoseTestButton() {
  const { activePose, applyPose } = usePoseToggle()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-wrap justify-end gap-2">
      {POSES.map((pose) => (
        <button
          key={pose.name}
          onClick={() => applyPose(pose.name, pose.json)}
          className={`rounded-xl px-4 py-2 font-bold text-white shadow-lg ${
            activePose === pose.name
              ? 'bg-secondary hover:bg-secondary-hover'
              : 'bg-primary hover:bg-primary-hover active:bg-primary-press'
          }`}
        >
          {activePose === pose.name ? 'Idle' : pose.label}
        </button>
      ))}
    </div>
  )
}
