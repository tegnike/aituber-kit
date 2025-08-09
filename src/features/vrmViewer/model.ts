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

/**
 * 3Dキャラクターを管理するクラス
 */
export class Model {
  public vrm?: VRM | null
  public mixer?: THREE.AnimationMixer
  public emoteController?: EmoteController

  private _lookAtTargetParent: THREE.Object3D
  private _lipSync?: LipSync
  private _audioElementWatcher?: {
    observer: MutationObserver
    connectedElements: Set<HTMLAudioElement>
  }

  constructor(lookAtTargetParent: THREE.Object3D) {
    console.log('🏗️ Model初期化開始')

    this._lookAtTargetParent = lookAtTargetParent

    try {
      // グローバルなAudioContextを使用（または既存のものを再利用）
      const audioContext = typeof window !== 'undefined' && window.AudioContext 
        ? new (window.AudioContext || (window as any).webkitAudioContext)()
        : new AudioContext()
      
      this._lipSync = new LipSync(audioContext, { forceStart: true })
      
      console.log('✅ LipSync初期化完了', {
        audioContextState: audioContext.state,
        sampleRate: audioContext.sampleRate,
        currentTime: audioContext.currentTime
      })
      
      // AudioContextが suspended の場合、ユーザーインタラクションで再開
      if (audioContext.state === 'suspended') {
        console.log('⚠️ AudioContext is suspended. 再開を試みます...')
        audioContext.resume().then(() => {
          console.log('✅ AudioContext resumed successfully')
        }).catch((error) => {
          console.error('❌ AudioContext resume failed:', error)
        })
      }
    } catch (error) {
      console.error('❌ LipSync初期化失敗:', error)
    }

    // 動的Audio要素監視システムの開始
    this.startAudioElementWatcher()
    
    console.log('✅ Model初期化完了')
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
    // Audio要素監視システムの停止
    this.stopAudioElementWatcher()
    
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene)
      this.vrm = null
    }
  }

  /**
   * VRMアニメーションを読み込む
   *
   * https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm_animation-1.0/README.ja.md
   */
  public async loadAnimation(vrmAnimation: VRMAnimation): Promise<void> {
    const { vrm, mixer } = this
    if (vrm == null || mixer == null) {
      throw new Error('You have to load VRM first')
    }

    const clip = vrmAnimation.createAnimationClip(vrm)
    const action = mixer.clipAction(clip)
    action.play()
  }

  /**
   * 音声を再生し、リップシンクを行う
   */
  public async speak(
    buffer: ArrayBuffer,
    talk: Talk,
    isNeedDecode: boolean = true
  ) {
    console.log('🗣️ Model.speak開始', {
      emotion: talk.emotion,
      bufferSize: buffer.byteLength,
      hasEmoteController: !!this.emoteController,
      hasLipSync: !!this._lipSync,
    })

    try {
      // 表情を設定
      if (this.emoteController) {
        console.log(`🎭 表情設定: ${talk.emotion}`)
        this.emoteController.playEmotion(talk.emotion)
      } else {
        console.warn('⚠️ EmoteControllerが利用できません')
      }

      // 音声再生とリップシンク
      if (this._lipSync) {
        console.log('🔊 音声再生開始', {
          bufferSize: buffer.byteLength,
          isNeedDecode,
          lipSyncStatus: (this._lipSync as any).getStatus?.()
        })
        
        // デバッグ: LipSyncの詳細状態を出力
        if (typeof (this._lipSync as any).logDetailedStatus === 'function') {
          (this._lipSync as any).logDetailedStatus()
        }
        
        await new Promise<void>((resolve) => {
          this._lipSync?.playFromArrayBuffer(
            buffer,
            () => {
              console.log('✅ 音声再生完了')
              resolve()
            },
            isNeedDecode
          )
        })
      } else {
        console.warn('⚠️ LipSyncが利用できません')
      }
    } catch (error) {
      console.error('❌ Model.speak処理エラー:', error)
    }
  }

  /**
   * LipSyncシステムのAudioContextを取得
   * ストリーミング音声で同一のAudioContextを使用するために必要
   */
  public getAudioContext(): AudioContext | null {
    if (this._lipSync && (this._lipSync as any).audio) {
      return (this._lipSync as any).audio as AudioContext
    }
    console.warn('⚠️ Model: LipSyncのAudioContextが取得できません')
    return null
  }

  /**
   * HTMLAudioElementをLipSyncシステムに接続（AudioContext統一版）
   * ストリーミング音声でもリップシンクを動作させるために使用
   */
  public connectAudioForLipSync(audioElement: HTMLAudioElement, useExistingContext: boolean = false): boolean {
    console.log('🔗 Model: HTMLAudioElementをLipSync（AudioContext統一版）に接続')
    
    if (!this._lipSync) {
      console.warn('⚠️ Model: LipSyncが利用できません')
      return false
    }

    if (useExistingContext) {
      // AudioContextを統一する場合の処理
      console.log('🎯 同一AudioContextでの接続を実行')
      if (typeof (this._lipSync as any).connectAudioElement === 'function') {
        try {
          (this._lipSync as any).connectAudioElement(audioElement)
          console.log('✅ Model: 統一AudioContextでのLipSync連携開始')
          return true
        } catch (error) {
          console.error('❌ Model: 統一AudioContext接続エラー:', error)
          return false
        }
      }
    } else {
      // 従来の方法（デバッグ用）
      if (typeof (this._lipSync as any).connectAudioElement === 'function') {
        (this._lipSync as any).connectAudioElement(audioElement)
        console.log('✅ Model: ストリーミング音声のLipSync連携開始')
        return true
      }
    }
    
    console.warn('⚠️ Model: connectAudioElementメソッドが利用できません')
    return false
  }

  /**
   * HTMLAudioElementのLipSync接続を解除
   */
  public disconnectAudioForLipSync() {
    console.log('🔗 Model: HTMLAudioElementのLipSync接続解除')
    if (this._lipSync && typeof (this._lipSync as any).disconnectAudioElement === 'function') {
      (this._lipSync as any).disconnectAudioElement()
      console.log('✅ Model: ストリーミング音声のLipSync連携終了')
    }
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

  public update(delta: number): void {
    try {
      // リップシンクの更新
      if (this._lipSync) {
        const { volume } = this._lipSync.update()

        // EmoteControllerにリップシンク情報を送信
        if (this.emoteController) {
          this.emoteController.lipSync('aa', volume)
        }

        // 必要に応じてデバッグログ（コメントアウト）
        // console.log(`🎙️ Model.update: LipSync volume=${volume.toFixed(4)}`)
      }

      // エモートコントローラーの更新
      if (this.emoteController) {
        this.emoteController.update(delta)
      }

      // アニメーションミキサーの更新
      if (this.mixer) {
        this.mixer.update(delta)
      }

      // VRMの更新
      if (this.vrm) {
        this.vrm.update(delta)
      }
    } catch (error) {
      console.error('❌ Model.update処理エラー:', error)
    }
  }

  /**
   * 動的Audio要素監視システムの開始
   * DOM内に新しいAudio要素が追加されたときに自動でLipSyncに接続
   */
  private startAudioElementWatcher() {
    if (typeof window === 'undefined') return // サーバーサイドでは実行しない
    
    console.log('👁️ Audio要素監視システム開始')
    
    this._audioElementWatcher = {
      observer: new MutationObserver(() => {}), // 後で設定
      connectedElements: new Set()
    }
    
    // 既存のAudio要素を検索して接続
    this.scanAndConnectAudioElements()
    
    // MutationObserverで新しいAudio要素を監視
    const observer = new MutationObserver((mutations) => {
      let hasNewAudioElements = false
      let detectedElements = []
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            
            // Audio要素が直接追加された場合
            if (element.tagName === 'AUDIO') {
              hasNewAudioElements = true
              detectedElements.push('直接Audio要素')
            }
            
            // Audio要素を含む要素が追加された場合
            const audioElements = element.querySelectorAll('audio')
            if (audioElements.length > 0) {
              hasNewAudioElements = true
              detectedElements.push(`${audioElements.length}個のAudio要素を含む要素`)
            }
          }
        })
      })
      
      if (hasNewAudioElements) {
        console.log('🔍 新しいAudio要素が検出されました - 接続チェック実行')
        setTimeout(() => this.scanAndConnectAudioElements(), 100) // 少し遅延して実行
      }
    })
    
    // DOM全体を監視
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    this._audioElementWatcher.observer = observer
  }
  
  /**
   * DOM内のAudio要素をスキャンしてLipSyncに接続
   */
  private scanAndConnectAudioElements() {
    if (!this._audioElementWatcher || !this._lipSync) return
    
    const audioElements = document.querySelectorAll('audio')
    if (audioElements.length === 0) return
    
    let newConnectionCount = 0
    
    audioElements.forEach((audio, index) => {
      // 既に接続済みの要素はスキップ
      if (this._audioElementWatcher!.connectedElements.has(audio)) {
        return
      }
      
      try {
        if (typeof (this._lipSync as any).connectAudioElement === 'function') {
          (this._lipSync as any).connectAudioElement(audio)
          this._audioElementWatcher!.connectedElements.add(audio)
          newConnectionCount++
          console.log(`✅ Audio要素[${index}] のLipSync接続完了`)
          
          // Audio要素が削除された時のクリーンアップ
          const handleRemoved = () => {
            if (this._audioElementWatcher?.connectedElements.has(audio)) {
              this._audioElementWatcher.connectedElements.delete(audio)
            }
          }
          
          // 要素が削除されるのを監視
          const removalObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.removedNodes.forEach((node) => {
                if (node === audio || (node as Element).contains?.(audio)) {
                  handleRemoved()
                  removalObserver.disconnect()
                }
              })
            })
          })
          
          removalObserver.observe(document.body, {
            childList: true,
            subtree: true
          })
        }
      } catch (error) {
        console.error(`❌ Audio要素[${index}]の自動接続エラー:`, error)
      }
    })
    
    if (newConnectionCount > 0) {
      console.log(`📊 ${newConnectionCount}個の新しいAudio要素を接続`)
    }
  }
  
  /**
   * Audio要素監視システムの停止
   */
  private stopAudioElementWatcher() {
    if (this._audioElementWatcher) {
      this._audioElementWatcher.observer.disconnect()
      this._audioElementWatcher.connectedElements.clear()
      console.log('🛑 Audio要素監視システム停止')
      this._audioElementWatcher = undefined
    }
  }

  /**
   * Audio要素の手動スキャンをトリガー（外部から呼び出し可能）
   */
  public scanAudioElements() {
    this.scanAndConnectAudioElements()
  }

  /**
   * デバッグ用のステータス取得
   */
  public getStatus() {
    return {
      hasVRM: !!this.vrm,
      hasEmoteController: !!this.emoteController,
      hasLipSync: !!this._lipSync,
      hasMixer: !!this.mixer,
      vrmStatus: this.vrm
        ? {
            hasExpressionManager: !!this.vrm.expressionManager,
            hasLookAt: !!this.vrm.lookAt,
            hasHumanoid: !!this.vrm.humanoid,
          }
        : null,
      emoteControllerStatus:
        this.emoteController &&
        typeof (this.emoteController as any).getStatus === 'function'
          ? (this.emoteController as any).getStatus()
          : null,
      lipSyncStatus:
        this._lipSync && typeof (this._lipSync as any).getStatus === 'function'
          ? (this._lipSync as any).getStatus()
          : null,
    }
  }
}
