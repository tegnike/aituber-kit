import * as THREE from 'three'
import type { Model } from '@/features/vrmViewer/model'
import type { PoseConfigItem } from '@/features/stores/settings'
import { createSequenceClip } from '@/lib/VRMAnimation/createSequenceClip'
import { loadPoseFromJSON } from '@/lib/VRMAnimation/loadPoseFromJSON'
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation'
import { buildUrl } from '@/utils/buildUrl'

const FADE_DURATION = 0.5

interface PoseState {
  poseAction: THREE.AnimationAction
  additiveAction: THREE.AnimationAction
}

export class PoseManager {
  private poseState: PoseState | null = null
  private applyRequestId = 0
  private currentPoseName: string | null = null

  async applyPose(
    model: Model,
    poseName: string,
    poseConfig: PoseConfigItem
  ): Promise<void> {
    if (!model.vrm || !model.mixer) return

    // 同じポーズが既にアクティブなら何もしない
    if (this.currentPoseName === poseName && this.poseState) return

    const requestId = ++this.applyRequestId

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
      if (requestId !== this.applyRequestId) return

      // 既存ポーズをフェードアウト（非同期ロード成功後）
      if (this.poseState) {
        this.poseState.poseAction.fadeOut(FADE_DURATION)
        this.poseState.additiveAction.fadeOut(FADE_DURATION)
      }

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

      if (!this.poseState && model.currentAction) {
        model.currentAction.fadeOut(FADE_DURATION)
      }

      poseAction.reset().fadeIn(FADE_DURATION).play()
      additiveAction.reset().fadeIn(FADE_DURATION).play()

      this.poseState = { poseAction, additiveAction }
      this.currentPoseName = poseName
    } else {
      const [pose, idleVrma] = await Promise.all([
        loadPoseFromJSON(buildUrl(poseConfig.json)),
        loadVRMAnimation(buildUrl('/idle_loop.vrma')),
      ])
      if (!pose || !idleVrma) return
      if (requestId !== this.applyRequestId) return

      // 既存ポーズをフェードアウト（非同期ロード成功後）
      if (this.poseState) {
        this.poseState.poseAction.fadeOut(FADE_DURATION)
        this.poseState.additiveAction.fadeOut(FADE_DURATION)
      }

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

      if (!this.poseState && model.currentAction) {
        model.currentAction.fadeOut(FADE_DURATION)
      }

      poseAction.reset().fadeIn(FADE_DURATION).play()
      additiveAction.reset().fadeIn(FADE_DURATION).play()

      this.poseState = { poseAction, additiveAction }
      this.currentPoseName = poseName
    }
  }

  resetToIdle(model: Model): void {
    if (!model.mixer) return

    model.poseYRotationOffset = 0

    if (this.poseState) {
      this.poseState.poseAction.fadeOut(FADE_DURATION)
      this.poseState.additiveAction.fadeOut(FADE_DURATION)
      this.poseState = null
      this.currentPoseName = null
    }
    if (model.currentAction) {
      model.currentAction.reset().fadeIn(FADE_DURATION).play()
    }
  }

  get isActive(): boolean {
    return this.poseState !== null
  }
}
