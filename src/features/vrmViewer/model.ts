import * as THREE from 'three'
import {
  VRM,
  VRMExpressionPresetName,
  VRMLoaderPlugin,
  VRMUtils,
} from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMAnimation } from '../../lib/VRMAnimation/VRMAnimation'
import { VRMLookAtSmootherLoaderPlugin } from '@/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin'
import { LipSync } from '../lipSync/lipSync'
import { EmoteController } from '../emoteController/emoteController'
import { Talk } from '../messages/messages'
import { loadVRMAnimationClip } from '@/lib/VRMAnimation/loadVRMAnimation'
import { buildUrl } from '@/utils/buildUrl'

/**
 * 3Dキャラクターを管理するクラス
 */
export class Model {
  public vrm?: VRM | null
  public mixer?: THREE.AnimationMixer
  public emoteController?: EmoteController
  private _animationActions: Map<string, THREE.AnimationAction> = new Map()
  private _currentAction: THREE.AnimationAction | null = null
  private _idleAnimationName: string = 'idle_default' // Default idle animation name

  // 仮の感情アニメーションマッピング (パスはsettingsStoreなどから取得することを想定)
  private _emotionAnimationPaths: Map<string, string> = new Map([
    ['neutral', '/neutral.vrma'], // デフォルトアイドルをneutralとする
    ['happy', '/vrma/happy.vrma'], // TODO: 実際のパスに置き換える
    ['sad', '/vrma/sad.vrma'], // TODO: 実際のパスに置き換える
    ['angry', '/vrma/angry.vrma'], // TODO: 実際のパスに置き換える
    // 他の感情も追加可能
  ])
  private _isEmotionAnimating: boolean = false
  private _watchingEmotionAction: THREE.AnimationAction | null = null
  private _emotionFadeOutThreshold: number = 0.5 // 終了の何秒前にアイドルへ移行するか

  private _lookAtTargetParent: THREE.Object3D
  private _lipSync?: LipSync

  constructor(lookAtTargetParent: THREE.Object3D) {
    this._lookAtTargetParent = lookAtTargetParent
    this._lipSync = new LipSync(new AudioContext(), { forceStart: true })
  }

  public async loadVRM(url: string): Promise<void> {
    const loader = new GLTFLoader()
    loader.register(
      (parser) =>
        new VRMLoaderPlugin(parser, {
          lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
        })
    )

    const gltf = await loader.loadAsync(url)

    const vrm = (this.vrm = gltf.userData.vrm)
    vrm.scene.name = 'VRMRoot'

    VRMUtils.rotateVRM0(vrm)
    this.mixer = new THREE.AnimationMixer(vrm.scene)

    this.emoteController = new EmoteController(vrm, this._lookAtTargetParent)
  }

  public unLoadVrm() {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene)
      this.vrm = null
    }
  }

  /**
   * VRMアニメーションを読み込む（従来の方法）
   */
  public async loadAnimation(
    vrmAnimation: VRMAnimation,
    animationName?: string
  ): Promise<THREE.AnimationAction | undefined> {
    if (this.vrm == null || this.mixer == null) {
      console.error('VRM or Mixer not initialized in loadAnimation')
      throw new Error('You have to load VRM first')
    }

    const clip = vrmAnimation.createAnimationClip(this.vrm)
    const action = this.mixer.clipAction(clip)

    const name =
      animationName || clip.name || `animation_${this._animationActions.size}`
    clip.name = name
    if (this._animationActions.has(name)) {
      console.warn(`Animation "${name}" already exists. Overwriting.`)
      this._animationActions.get(name)?.stop()
    }
    this._animationActions.set(name, action)

    console.log(`Animation "${name}" loaded.`)
    return action
  }

  /**
   * VRMアニメーションを読み込む（ベストプラクティス準拠）
   */
  public async loadAnimationFromUrl(
    url: string,
    animationName?: string
  ): Promise<THREE.AnimationAction | undefined> {
    if (this.vrm == null || this.mixer == null) {
      console.error('VRM or Mixer not initialized in loadAnimationFromUrl')
      throw new Error('You have to load VRM first')
    }

    try {
      const clip = await loadVRMAnimationClip(url, this.vrm)
      if (!clip) {
        console.warn(`Failed to load animation clip from ${url}`)
        return undefined
      }

      const action = this.mixer.clipAction(clip)
      const name =
        animationName || clip.name || `animation_${this._animationActions.size}`
      clip.name = name

      if (this._animationActions.has(name)) {
        console.warn(`Animation "${name}" already exists. Overwriting.`)
        this._animationActions.get(name)?.stop()
      }
      this._animationActions.set(name, action)

      console.log(`Animation "${name}" loaded from URL with best practices.`)
      return action
    } catch (error) {
      console.error(`Error loading animation from ${url}:`, error)
      return undefined
    }
  }

  /**
   * 不要なTranslationトラックを除去（Hips以外）
   */
  private removeUnnecessaryTranslationTracks(clip: THREE.AnimationClip) {
    clip.tracks = clip.tracks.filter((track) => {
      // Hipsボーンの位置変化は保持、その他のTranslationは除去
      if (
        track.name.includes('.position') &&
        !track.name.toLowerCase().includes('hips')
      ) {
        console.log(`Removing unnecessary translation track: ${track.name}`)
        return false
      }
      return true
    })
  }

  /**
   * 足を地面に固定する処理
   */
  private constrainFeetToGround() {
    if (!this.vrm?.humanoid) return

    const leftFoot = this.vrm.humanoid.getNormalizedBoneNode('leftFoot')
    const rightFoot = this.vrm.humanoid.getNormalizedBoneNode('rightFoot')

    // 地面のY座標（通常は0）
    const groundY = 0

    if (leftFoot) {
      const worldPosition = new THREE.Vector3()
      leftFoot.getWorldPosition(worldPosition)

      // 足が地面より下にある場合、地面の高さに調整
      if (worldPosition.y < groundY) {
        const localPosition = leftFoot.position.clone()
        localPosition.y += groundY - worldPosition.y
        leftFoot.position.copy(localPosition)
      }
    }

    if (rightFoot) {
      const worldPosition = new THREE.Vector3()
      rightFoot.getWorldPosition(worldPosition)

      // 足が地面より下にある場合、地面の高さに調整
      if (worldPosition.y < groundY) {
        const localPosition = rightFoot.position.clone()
        localPosition.y += groundY - worldPosition.y
        rightFoot.position.copy(localPosition)
      }
    }
  }

  public async loadFbxAnimation(
    clip: THREE.AnimationClip,
    animationName?: string // アニメーションを識別するための名前
  ): Promise<THREE.AnimationAction | undefined> {
    if (this.vrm == null || this.mixer == null) {
      throw new Error('You have to load VRM first')
    }

    // this.mixer = new THREE.AnimationMixer(this.vrm.scene) // reset animation mixer, otherwise funny merge

    const action = this.mixer.clipAction(clip)
    const name =
      animationName || clip.name || `animation_${this._animationActions.size}`
    clip.name = name // Ensure the AnimationClip itself has the correct name
    this._animationActions.set(name, action)

    return action
  }

  /**
   * 指定された名前のアニメーションを再生する（クロスフェードなし）
   */
  public playAnimation(
    name: string,
    loop: THREE.AnimationActionLoopStyles = THREE.LoopRepeat
  ) {
    const action = this._animationActions.get(name)
    if (!action) {
      console.warn(`Animation "${name}" not found.`)
      return
    }

    if (this._currentAction && this._currentAction !== action) {
      this._currentAction.stop()
    }

    action.reset().setLoop(loop, Infinity).play()
    this._currentAction = action
  }

  /**
   * 指定された名前のアニメーションにクロスフェードで遷移する
   * @param name 再生するアニメーション名
   * @param duration フェード時間 (秒)
   */
  public crossFadeToAnimation(
    name: string,
    duration: number,
    loop: THREE.AnimationActionLoopStyles = THREE.LoopRepeat
  ) {
    const nextAction = this._animationActions.get(name)
    if (!nextAction) {
      console.warn(`Animation "${name}" not found for crossfade.`)
      return
    }

    // 現在アクションが同じで既に再生中の場合は何もしない
    if (this._currentAction === nextAction && nextAction.isRunning()) {
      console.log(`Animation "${name}" is already current and running.`)
      return
    }

    // crossfade 可能かどうか判定
    const canCrossFade =
      this._currentAction && this._currentAction !== nextAction

    console.log(
      `[crossFadeToAnimation] canCrossFade: ${canCrossFade}, currentAction: ${this._currentAction?.getClip().name}, nextAction: ${nextAction.getClip().name}`
    )

    // 次のアクションを準備して再生
    nextAction.reset().setLoop(loop, Infinity).play()

    if (canCrossFade) {
      // 通常のクロスフェード
      this._currentAction!.crossFadeTo(nextAction, duration, true)
    } else {
      // クロスフェードできない場合はすぐに次アクションへ切り替え
      // 1) 以前のアクションがまだ残っていれば停止してウェイトを 0 にする
      if (this._currentAction && this._currentAction !== nextAction) {
        this._currentAction.stop()
      }

      // 2) 次アクションを有効化しウェイトを 1 に設定して即時反映 (T ポーズ防止)
      nextAction.enabled = true
      nextAction.setEffectiveWeight(0.05)
    }

    this._currentAction = nextAction
    this._isEmotionAnimating =
      name !== this._idleAnimationName && loop === THREE.LoopOnce
  }

  /**
   * 現在のアニメーションを停止する
   */
  public stopCurrentAnimation(duration: number = 0.25) {
    if (this._currentAction) {
      // アイドルアニメーションなどがあれば、そちらにフェードアウトすることも検討
      this._currentAction.fadeOut(duration)
      // this._currentAction = null // アイドルへの遷移後にnull化など
    }
  }

  /**
   * すべてのアニメーションアクションを停止・リセットする
   */
  public resetAnimations() {
    this.mixer?.stopAllAction()
    // アクション自体は保持しておくので、クリアはしない
    // this._animationActions.forEach(action => {
    //     // 必要に応じて action.reset() なども
    // })
    this._currentAction = null
    this._isEmotionAnimating = false
    this._watchingEmotionAction = null
  }

  /**
   * 音声を再生し、リップシンクを行う
   */
  public async speak(
    buffer: ArrayBuffer,
    talk: Talk,
    isNeedDecode: boolean = true
  ) {
    this.emoteController?.playEmotion(talk.emotion)
    await new Promise((resolve) => {
      this._lipSync?.playFromArrayBuffer(
        buffer,
        () => {
          resolve(true)
        },
        isNeedDecode
      )
    })
  }

  /**
   * 現在の音声再生を停止
   */
  public stopSpeaking() {
    this._lipSync?.stopCurrentPlayback()
  }

  /**
   * 感情表現を再生する
   */
  public async playEmotion(preset: VRMExpressionPresetName) {
    this.emoteController?.playEmotion(preset)
  }

  /**
   * アイドルアニメーションの名前を設定する
   */
  public setIdleAnimationName(name: string) {
    this._idleAnimationName = name
  }

  /**
   * 定義された感情アニメーションをすべてロードする
   */
  public async loadAllEmotionAnimations(): Promise<void> {
    if (!this.vrm || !this.mixer) {
      console.error('VRM or Mixer not ready for loading emotion animations.')
      return
    }
    console.log('Loading all emotion animations...')
    for (const [emotion, path] of this._emotionAnimationPaths) {
      try {
        // buildUrlを使用してパスを構築
        const fullPath = buildUrl(path)
        // ベストプラクティス準拠の新しいメソッドを使用
        await this.loadAnimationFromUrl(fullPath, emotion)
      } catch (error) {
        console.error(
          `Error loading emotion animation for "${emotion}" from ${path}:`,
          error
        )
      }
    }
    console.log('Finished loading emotion animations.')
  }

  /**
   * 指定された感情のアニメーションを再生する。
   * 再生終了後 (ループしない場合) はアイドルアニメーションに戻る。
   */
  public playEmotionAnimation(
    emotionName: string,
    crossFadeDuration: number = 0.3
  ) {
    if (!this._animationActions.has(this._idleAnimationName)) {
      console.warn(
        'Idle animation is not loaded. Cannot properly manage emotion animations.'
      )
      // アイドルがない場合は、単純に指定された感情アニメーションを再生するだけでも良いかもしれない
    }

    const emotionAction = this._animationActions.get(emotionName)
    if (!emotionAction) {
      console.warn(`Emotion animation "${emotionName}" not found.`)
      return
    }

    console.log(
      `[playEmotionAnimation] Starting emotion: "${emotionName}". Current action: "${this._currentAction?.getClip().name}", Crossfade duration: ${crossFadeDuration}`
    )
    this.crossFadeToAnimation(emotionName, crossFadeDuration, THREE.LoopRepeat)
    this._isEmotionAnimating = true // 感情アニメーション中フラグを立てる
  }

  public update(delta: number): void {
    if (this._lipSync) {
      const { volume } = this._lipSync.update()
      this.emoteController?.lipSync('aa', volume)
    }

    this.emoteController?.update(delta)
    this.mixer?.update(delta)

    // アニメーション更新後に足を地面に固定
    if (this._currentAction && this._currentAction.isRunning()) {
      this.constrainFeetToGround()
    }

    this.vrm?.update(delta)
  }

  /**
   * アイドルアニメーションに戻る
   * @param crossFadeDuration クロスフェード時間 (秒)
   */
  public returnToIdleAnimation(crossFadeDuration: number = 0.3) {
    if (!this.vrm || !this.mixer) {
      console.warn('VRM or Mixer not ready to return to idle animation.')
      return
    }

    if (!this._animationActions.has(this._idleAnimationName)) {
      console.warn(
        `Idle animation "${this._idleAnimationName}" not loaded. Cannot return to idle.`
      )
      return
    }

    // 現在再生中のアニメーションがアイドルアニメーションでなければ遷移する
    if (
      !this._currentAction ||
      this._currentAction.getClip().name !== this._idleAnimationName
    ) {
      console.log(
        `[returnToIdleAnimation] Transitioning to idle: "${this._idleAnimationName}", Crossfade duration: ${crossFadeDuration}`
      )
      this.crossFadeToAnimation(
        this._idleAnimationName,
        crossFadeDuration,
        THREE.LoopRepeat
      )
      this._isEmotionAnimating = false
    } else {
      console.log(
        `[returnToIdleAnimation] Already in idle animation: "${this._idleAnimationName}". No transition needed.`
      )
    }
  }
}
