import { useState, useRef } from 'react'
import * as THREE from 'three'
import homeStore from '@/features/stores/home'
import { loadPoseFromJSON } from '@/lib/VRMAnimation/loadPoseFromJSON'
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation'
import { buildUrl } from '@/utils/buildUrl'

const FADE_DURATION = 0.5

export default function PoseTestButton() {
  const [isPosing, setIsPosing] = useState(false)
  const poseActionRef = useRef<THREE.AnimationAction | null>(null)
  const additiveActionRef = useRef<THREE.AnimationAction | null>(null)

  const handleClick = async () => {
    const { viewer } = homeStore.getState()
    const model = viewer.model
    if (!model?.vrm || !model.mixer) return

    if (!isPosing) {
      const [pose, idleVrma] = await Promise.all([
        loadPoseFromJSON(buildUrl('/think.json')),
        loadVRMAnimation(buildUrl('/idle_loop.vrma')),
      ])
      if (!pose || !idleVrma) return

      // thinkポーズをNormalで再生
      const poseClip = pose.createAnimationClip(model.vrm)
      // 現在のhips位置をキャプチャしてthink clipに焼き込み、位置ズレを防ぐ
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
      const poseAction = model.mixer.clipAction(poseClip)

      // idle_loopのadditive版を作成（restポーズからの差分＝揺れだけが加算される）
      const additiveClip = idleVrma.createAnimationClip(model.vrm)
      THREE.AnimationUtils.makeClipAdditive(additiveClip)
      // hipsのpositionトラックを除去して位置を固定
      if (hipsNode) {
        additiveClip.tracks = additiveClip.tracks.filter(
          (track) => track.name !== `${hipsNode.name}.position`
        )
      }
      additiveClip.name = 'idle_additive'
      const additiveAction = model.mixer.clipAction(additiveClip)
      additiveAction.blendMode = THREE.AdditiveAnimationBlendMode

      // 元のidleをfadeOut
      if (model.currentAction) {
        model.currentAction.fadeOut(FADE_DURATION)
      }

      // thinkをfadeIn（ベースポーズ）
      poseAction.reset().fadeIn(FADE_DURATION).play()

      // additive揺れをfadeIn（thinkの上に揺れが乗る）
      additiveAction.reset().fadeIn(FADE_DURATION).play()

      poseActionRef.current = poseAction
      additiveActionRef.current = additiveAction
      setIsPosing(true)
    } else {
      // thinkをfadeOut
      if (poseActionRef.current) {
        poseActionRef.current.fadeOut(FADE_DURATION)
        poseActionRef.current = null
      }
      // additive揺れをfadeOut
      if (additiveActionRef.current) {
        additiveActionRef.current.fadeOut(FADE_DURATION)
        additiveActionRef.current = null
      }
      // 元のidleをfadeInで復帰
      if (model.currentAction) {
        model.currentAction.reset().fadeIn(FADE_DURATION).play()
      }
      setIsPosing(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-50 rounded-xl bg-primary px-4 py-2 font-bold text-white shadow-lg hover:bg-primary-hover active:bg-primary-press"
    >
      {isPosing ? 'Idle' : 'Think'}
    </button>
  )
}
