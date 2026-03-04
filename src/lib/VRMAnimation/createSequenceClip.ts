import * as THREE from 'three'
import { VRM, VRMHumanBoneName } from '@pixiv/three-vrm'
import { VRMAnimation } from './VRMAnimation'

/**
 * 複数のVRMAnimationポーズを時間軸に並べた1つのループ用AnimationClipを作成する。
 * 最後に最初のポーズと同じキーフレームを追加し、シームレスなループを実現する。
 *
 * 例: 2ポーズ, switchDuration=0.5
 * → t=0(pose1), t=0.5(pose2), t=1.0(pose1), duration=1.0
 */
export function createSequenceClip(
  poses: VRMAnimation[],
  vrm: VRM,
  switchDuration: number
): THREE.AnimationClip {
  const humanoid = vrm.humanoid
  const metaVersion = vrm.meta.metaVersion
  const totalDuration = switchDuration * poses.length

  // 全ポーズに登場するボーン名を集める
  const allBoneNames = new Set<VRMHumanBoneName>()
  for (const pose of poses) {
    for (const name of pose.humanoidTracks.rotation.keys()) {
      allBoneNames.add(name)
    }
  }

  const tracks: THREE.KeyframeTrack[] = []

  // rotationトラック
  for (const boneName of allBoneNames) {
    const nodeName = humanoid.getNormalizedBoneNode(boneName)?.name
    if (!nodeName) continue

    // times: [0, switchDuration, switchDuration*2, ...] + 最後にtotalDuration
    const times: number[] = []
    const values: number[] = []

    for (let i = 0; i < poses.length; i++) {
      times.push(i * switchDuration)
      const track = poses[i].humanoidTracks.rotation.get(boneName)
      if (track) {
        // 最初のキーフレームの値を使用（静止ポーズなので1フレームのみ）
        const v = track.values
        const x = metaVersion === '0' ? -v[0] : v[0]
        const y = v[1]
        const z = metaVersion === '0' ? -v[2] : v[2]
        const w = v[3]
        values.push(x, y, z, w)
      } else {
        // このポーズにこのボーンがない場合はidentity quaternion
        values.push(0, 0, 0, 1)
      }
    }

    // ループ用: 最初のポーズと同じ値を末尾に追加
    times.push(totalDuration)
    const firstTrack = poses[0].humanoidTracks.rotation.get(boneName)
    if (firstTrack) {
      const v = firstTrack.values
      const x = metaVersion === '0' ? -v[0] : v[0]
      const y = v[1]
      const z = metaVersion === '0' ? -v[2] : v[2]
      const w = v[3]
      values.push(x, y, z, w)
    } else {
      values.push(0, 0, 0, 1)
    }

    tracks.push(
      new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, values)
    )
  }

  return new THREE.AnimationClip('Sequence', totalDuration, tracks)
}
