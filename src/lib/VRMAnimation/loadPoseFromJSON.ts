import * as THREE from 'three'
import { VRMHumanBoneName } from '@pixiv/three-vrm'
import { VRMAnimation } from './VRMAnimation'

interface PoseTrackData {
  times: number[]
  values: number[][]
  interpolation: string
}

interface PoseBoneData {
  rotation?: PoseTrackData
  translation?: PoseTrackData
}

interface PoseJSON {
  specVersion: string
  duration: number
  restHipsPosition: number[]
  boneNames: string[]
  bones: Record<string, PoseBoneData>
  expressions?: Record<
    string,
    { times: number[]; values: number[]; interpolation: string }
  >
}

export async function loadPoseFromJSON(
  url: string
): Promise<VRMAnimation | null> {
  const response = await fetch(url)
  const json: PoseJSON = await response.json()

  const animation = new VRMAnimation()
  animation.duration = json.duration
  animation.restHipsPosition = new THREE.Vector3(
    json.restHipsPosition[0],
    json.restHipsPosition[1],
    json.restHipsPosition[2]
  )

  for (const [boneName, boneData] of Object.entries(json.bones)) {
    if (boneData.rotation) {
      const times = new Float32Array(boneData.rotation.times)
      const values = new Float32Array(boneData.rotation.values.flat())
      const track = new THREE.VectorKeyframeTrack(
        `${boneName}.quaternion`,
        times,
        values
      )
      animation.humanoidTracks.rotation.set(boneName as VRMHumanBoneName, track)
    }

    // hipsのtranslationはスケール差で位置ずれするため除外し、位置はidleに任せる
    if (boneData.translation && boneName !== 'hips') {
      const times = new Float32Array(boneData.translation.times)
      const values = new Float32Array(boneData.translation.values.flat())
      const track = new THREE.VectorKeyframeTrack(
        `${boneName}.position`,
        times,
        values
      )
      animation.humanoidTracks.translation.set(
        boneName as VRMHumanBoneName,
        track
      )
    }
  }

  if (json.expressions) {
    for (const [exprName, exprData] of Object.entries(json.expressions)) {
      const times = new Float32Array(exprData.times)
      const values = new Float32Array(exprData.values)
      const track = new THREE.NumberKeyframeTrack(
        `${exprName}.weight`,
        times,
        values
      )
      animation.expressionTracks.set(exprName, track)
    }
  }

  return animation
}
