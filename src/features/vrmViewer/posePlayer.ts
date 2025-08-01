import * as THREE from 'three'
import { VRM } from '@pixiv/three-vrm'
import { PoseData, AnimationFrameData } from '@/types/pose'

/**
 * VRMモデルにJSONポーズデータを適用するクラス
 */
export class PosePlayer {
  private vrm: VRM | null = null
  private animationData: AnimationFrameData | null = null
  private currentTime: number = 0
  private isPlaying: boolean = false
  private loop: boolean = true
  private initialPose: Map<string, { rotation: THREE.Quaternion; position?: THREE.Vector3 }> = new Map()
  
  // 呼吸動作関連
  private enableBreathing: boolean = true
  private breathingTime: number = 0
  private breathingAmplitude: number = 0.008 // 呼吸の振幅（もう少し大きく）
  private breathingFrequency: number = 0.25 // 呼吸の周波数

  constructor(vrm: VRM | null = null) {
    this.vrm = vrm
    if (vrm) {
      this.saveInitialPose()
    }
  }

  /**
   * VRMモデルを設定
   */
  setVRM(vrm: VRM) {
    this.vrm = vrm
    this.saveInitialPose()
  }

  /**
   * 初期ポーズを保存
   */
  private saveInitialPose() {
    if (!this.vrm) return

    const humanoid = this.vrm.humanoid
    const boneNames = [
      'hips', 'spine', 'chest', 'upperChest', 'neck', 'head',
      'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand',
      'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand',
      'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'leftToes',
      'rightUpperLeg', 'rightLowerLeg', 'rightFoot', 'rightToes'
    ]

    boneNames.forEach(boneName => {
      const bone = humanoid.getRawBoneNode(boneName)
      if (bone) {
        const rotation = bone.quaternion.clone()
        const position = boneName === 'hips' ? bone.position.clone() : undefined
        this.initialPose.set(boneName, { rotation, position })
      }
    })
  }

  /**
   * JSONファイルからアニメーションデータを読み込み
   */
  async loadAnimationFromJSON(jsonData: AnimationFrameData | PoseData): Promise<void> {
    // 単一ポーズデータの場合は配列に変換
    if ('bones' in jsonData && !('frames' in jsonData)) {
      this.animationData = {
        frames: [jsonData as PoseData],
        duration: 0.1,
        fps: 1,
        name: 'single_pose'
      }
    } else {
      this.animationData = jsonData as AnimationFrameData
    }
    this.currentTime = 0
  }

  /**
   * JSONファイルパスからアニメーションデータを読み込み
   */
  async loadAnimationFromFile(filePath: string): Promise<void> {
    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to load animation file: ${response.statusText}`)
      }
      const jsonData: AnimationFrameData = await response.json()
      await this.loadAnimationFromJSON(jsonData)
    } catch (error) {
      console.error('Error loading animation file:', error)
      throw error
    }
  }

  /**
   * 特定のポーズデータを適用
   */
  applyPose(poseData: PoseData): boolean {
    if (!this.vrm) return false

    const humanoid = this.vrm.humanoid
    let appliedCount = 0

    Object.entries(poseData.bones).forEach(([boneName, boneData]) => {
      const bone = humanoid.getRawBoneNode(boneName)
      if (!bone) return

      // クォータニオンを適用
      if (boneData.rotation) {
        const quaternion = new THREE.Quaternion(
          boneData.rotation.x,
          boneData.rotation.y,
          boneData.rotation.z,
          boneData.rotation.w
        )

        // ワールドクォータニオンをローカルクォータニオンに変換
        const localQuaternion = this.worldToLocalQuaternion(bone, quaternion)
        bone.quaternion.copy(localQuaternion)
        appliedCount++
      }

      // 位置情報を適用（hipsのみ）
      if (boneName === 'hips' && boneData.position) {
        bone.position.set(
          boneData.position.x,
          boneData.position.y,
          boneData.position.z
        )
      }
    })

    return appliedCount > 0
  }

  /**
   * ワールドクォータニオンをローカルクォータニオンに変換
   */
  private worldToLocalQuaternion(node: THREE.Object3D, worldQuaternion: THREE.Quaternion): THREE.Quaternion {
    if (!node.parent) return worldQuaternion.clone()

    const parentWorldQuaternion = new THREE.Quaternion()
    node.parent.getWorldQuaternion(parentWorldQuaternion)
    
    // localQ = parentWorldQ^-1 * worldQ
    const parentInverse = parentWorldQuaternion.clone().invert()
    return parentInverse.multiply(worldQuaternion)
  }

  /**
   * 現在の時間に対応するポーズを取得
   */
  private getCurrentPose(): PoseData | null {
    if (!this.animationData || this.animationData.frames.length === 0) return null

    const frames = this.animationData.frames
    
    // 現在時間に最も近いフレームを検索
    let targetFrame = frames[0]
    for (const frame of frames) {
      if (frame.timestamp <= this.currentTime) {
        targetFrame = frame
      } else {
        break
      }
    }

    return targetFrame
  }

  /**
   * アニメーション再生開始
   */
  play() {
    this.isPlaying = true
  }

  /**
   * アニメーション再生停止
   */
  pause() {
    this.isPlaying = false
  }

  /**
   * アニメーション停止・リセット
   */
  stop() {
    this.isPlaying = false
    this.currentTime = 0
  }

  /**
   * ループ設定
   */
  setLoop(loop: boolean) {
    this.loop = loop
  }

  /**
   * 初期ポーズにリセット
   */
  resetPose() {
    if (!this.vrm) return

    const humanoid = this.vrm.humanoid
    this.initialPose.forEach((poseData, boneName) => {
      const bone = humanoid.getRawBoneNode(boneName)
      if (bone) {
        bone.quaternion.copy(poseData.rotation)
        if (poseData.position) {
          bone.position.copy(poseData.position)
        }
      }
    })
  }

  /**
   * アニメーション更新（毎フレーム呼び出し）
   */
  update(delta: number) {
    // 呼吸動作の時間更新（常に実行）
    if (this.enableBreathing) {
      this.breathingTime += delta
    }

    if (!this.isPlaying || !this.animationData) {
      // 静的ポーズでも呼吸動作を適用
      if (this.enableBreathing && this.animationData) {
        const currentPose = this.getCurrentPose()
        if (currentPose) {
          this.applyPoseWithBreathing(currentPose)
        }
      }
      return
    }

    this.currentTime += delta

    // ループ処理
    if (this.currentTime > this.animationData.duration) {
      if (this.loop) {
        this.currentTime = 0
      } else {
        this.isPlaying = false
        return
      }
    }

    // 現在時間のポーズを適用（呼吸動作付き）
    const currentPose = this.getCurrentPose()
    if (currentPose) {
      if (this.enableBreathing) {
        this.applyPoseWithBreathing(currentPose)
      } else {
        this.applyPose(currentPose)
      }
    }
  }

  /**
   * 現在の再生状態を取得
   */
  /**
   * ポーズデータに呼吸動作を重ねて適用
   */
  private applyPoseWithBreathing(poseData: PoseData): boolean {
    if (!this.vrm) return false

    const result = this.applyPose(poseData)
    
    // 呼吸動作を追加適用
    this.applyBreathingMotion()
    
    return result
  }

  /**
   * 呼吸動作を適用（微細な横揺れ）
   */
  private applyBreathingMotion() {
    if (!this.vrm || !this.enableBreathing) return

    const humanoid = this.vrm.humanoid
    const breathingBones = ['chest', 'spine', 'upperChest']
    
    const swayAngle = Math.sin(this.breathingTime * Math.PI * 2 * this.breathingFrequency) * this.breathingAmplitude

    breathingBones.forEach(boneName => {
      const bone = humanoid.getRawBoneNode(boneName)
      if (bone) {
        // 現在の回転に呼吸動作を重ね合わせ
        const currentRotation = bone.rotation.clone()
        currentRotation.z += swayAngle
        bone.rotation.copy(currentRotation)
      }
    })
  }

  /**
   * 呼吸動作の有効/無効を設定
   */
  setBreathingEnabled(enabled: boolean) {
    this.enableBreathing = enabled
  }

  /**
   * 呼吸動作のパラメータを設定
   */
  setBreathingParams(amplitude: number, frequency: number) {
    this.breathingAmplitude = amplitude
    this.breathingFrequency = frequency
  }

  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.animationData?.duration || 0,
      progress: this.animationData ? this.currentTime / this.animationData.duration : 0
    }
  }
}