import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { VRMAnimation } from './VRMAnimation'
import { VRMAnimationLoaderPlugin } from './VRMAnimationLoaderPlugin'
import type { VRM } from '@pixiv/three-vrm'

const loader = new GLTFLoader()
loader.register((parser) => new VRMLoaderPlugin(parser))
loader.register((parser) => new VRMAnimationLoaderPlugin(parser))

export async function loadVRMAnimation(
  url: string
): Promise<VRMAnimation | null> {
  const gltf = await loader.loadAsync(url)

  const vrmAnimations: VRMAnimation[] = gltf.userData.vrmAnimations
  const vrmAnimation: VRMAnimation | undefined = vrmAnimations[0]

  return vrmAnimation ?? null
}

/**
 * ベストプラクティスに従ったVRMAアニメーションの読み込みとAnimationClip作成
 */
export async function loadVRMAnimationClip(
  url: string,
  vrm: VRM
): Promise<THREE.AnimationClip | null> {
  try {
    const gltf = await loader.loadAsync(url)
    const vrmAnimations = gltf.userData.vrmAnimations
    if (vrmAnimations && vrmAnimations.length > 0) {
      // VRMAnimationからAnimationClipを作成
      const vrmAnimation: VRMAnimation = vrmAnimations[0]
      return vrmAnimation.createAnimationClip(vrm)
    }
    return null
  } catch (error) {
    console.error('Error loading VRM animation clip:', error)
    return null
  }
}
