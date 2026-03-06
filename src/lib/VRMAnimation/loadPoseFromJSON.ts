import * as THREE from 'three'
import { VRMHumanBoneName } from '@pixiv/three-vrm'
import { VRMAnimation } from '@/lib/VRMAnimation/VRMAnimation'

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
  yRotationOffsetDeg?: number
}

function convertWebPoseToVrma(webPose: {
  pose: Record<string, { rotation?: number[] }>
}): PoseJSON {
  const bones: Record<string, PoseBoneData> = {}
  const boneNames: string[] = []
  for (const [boneName, boneData] of Object.entries(webPose.pose)) {
    if (boneData.rotation) {
      boneNames.push(boneName)
      bones[boneName] = {
        rotation: {
          times: [0],
          values: [boneData.rotation],
          interpolation: 'LINEAR',
        },
      }
    }
  }
  return {
    specVersion: '1.0',
    duration: 0,
    restHipsPosition: [0, 0, 0],
    boneNames: boneNames.sort(),
    bones,
  }
}

export async function loadPoseFromJSON(
  url: string
): Promise<VRMAnimation | null> {
  let json: PoseJSON
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const raw = await response.json()
    // VRM Web Pose形式の場合は変換
    if (raw.version && raw.pose && !raw.specVersion) {
      json = convertWebPoseToVrma(raw)
      json.yRotationOffsetDeg = raw.yRotationOffsetDeg
    } else {
      json = raw
    }
  } catch {
    console.error(`Failed to load pose JSON: ${url}`)
    return null
  }

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

  // yRotationOffsetDegが設定されている場合、hipsのrotationにY軸回転を適用
  if (json.yRotationOffsetDeg && json.yRotationOffsetDeg !== 0) {
    let hipsTrack = animation.humanoidTracks.rotation.get(
      'hips' as VRMHumanBoneName
    )
    if (!hipsTrack) {
      // hipsトラックが無い場合（VRM Web Pose等）、identity quaternionで作成
      hipsTrack = new THREE.VectorKeyframeTrack(
        'hips.quaternion',
        new Float32Array([0]),
        new Float32Array([0, 0, 0, 1])
      )
      animation.humanoidTracks.rotation.set(
        'hips' as VRMHumanBoneName,
        hipsTrack
      )
    }
    {
      const rad = (json.yRotationOffsetDeg * Math.PI) / 180
      const delta = new THREE.Quaternion(
        0,
        Math.sin(rad / 2),
        0,
        Math.cos(rad / 2)
      )
      const values = hipsTrack.values
      for (let i = 0; i < values.length; i += 4) {
        const orig = new THREE.Quaternion(
          values[i],
          values[i + 1],
          values[i + 2],
          values[i + 3]
        )
        orig.premultiply(delta).normalize()
        values[i] = orig.x
        values[i + 1] = orig.y
        values[i + 2] = orig.z
        values[i + 3] = orig.w
      }
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
