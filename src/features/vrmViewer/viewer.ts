import * as THREE from 'three'
import { Model } from './model'
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation'
import { buildUrl } from '@/utils/buildUrl'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import settingsStore from '@/features/stores/settings'

/**
 * three.jsを使った3Dビューワー
 *
 * setup()でcanvasを渡してから使う
 */
export class Viewer {
  public isReady: boolean
  public model?: Model

  private _renderer?: THREE.WebGLRenderer
  private _clock: THREE.Clock
  private _scene: THREE.Scene
  private _camera?: THREE.PerspectiveCamera
  private _cameraControls?: OrbitControls
  private _directionalLight?: THREE.DirectionalLight
  private _ambientLight?: THREE.AmbientLight

  constructor() {
    this.isReady = false

    // scene
    const scene = new THREE.Scene()
    this._scene = scene

    // light
    const lightingIntensity = settingsStore.getState().lightingIntensity
    this._directionalLight = new THREE.DirectionalLight(
      0xffffff,
      1.8 * lightingIntensity
    )
    this._directionalLight.position.set(1.0, 1.0, 1.0).normalize()
    scene.add(this._directionalLight)

    this._ambientLight = new THREE.AmbientLight(
      0xffffff,
      1.2 * lightingIntensity
    )
    scene.add(this._ambientLight)

    // animate
    this._clock = new THREE.Clock()
    this._clock.start()
  }

  public loadVrm(url: string) {
    console.log('🎭 VRM読み込み開始:', {
      url,
      isReady: this.isReady,
      hasCamera: !!this._camera,
      hasRenderer: !!this._renderer,
    })

    if (this.model?.vrm) {
      console.log('🗑️ 既存のVRMをアンロード')
      this.unloadVRM()
    }

    // Viewerが適切にセットアップされているか確認
    if (!this.isReady) {
      console.error(
        '❌ Viewerがセットアップされていません。setup()メソッドを先に実行してください。'
      )
      return
    }

    if (!this._camera) {
      console.error('❌ カメラが初期化されていません')
      return
    }

    // gltf and vrm
    console.log('🏗️ Modelインスタンス作成')
    this.model = new Model(this._camera)
    this.model
      .loadVRM(url)
      .then(async () => {
        if (!this.model?.vrm) {
          console.error('❌ VRM読み込み失敗')
          return
        }

        console.log('✅ VRM読み込み成功', {
          name: this.model.vrm.scene.name,
          hasExpressionManager: !!this.model.vrm.expressionManager,
          hasLookAt: !!this.model.vrm.lookAt,
          hasHumanoid: !!this.model.vrm.humanoid,
        })

        // Disable frustum culling
        this.model.vrm.scene.traverse((obj) => {
          obj.frustumCulled = false
        })

        this._scene.add(this.model.vrm.scene)
        console.log('🎬 VRMをシーンに追加')

        try {
          const vrma = await loadVRMAnimation(buildUrl('/idle_loop.vrma'))
          if (vrma) {
            this.model.loadAnimation(vrma)
            console.log('🎵 アイドルアニメーション読み込み完了')
          } else {
            console.log('ℹ️ アイドルアニメーションが見つかりません')
          }
        } catch (error) {
          console.warn('⚠️ アニメーション読み込みエラー:', error)
        }

        // HACK: アニメーションの原点がずれているので再生後にカメラ位置を調整する
        requestAnimationFrame(() => {
          this.resetCamera()
          console.log('📷 カメラ位置調整完了')

          // VRM読み込み完了のログ出力
          this.logVRMStatus()
        })
      })
      .catch((error) => {
        console.error('❌ VRM読み込みエラー:', error)
      })
  }

  public unloadVRM(): void {
    if (this.model?.vrm) {
      this._scene.remove(this.model.vrm.scene)
      this.model?.unLoadVrm()
    }
  }

  /**
   * Reactで管理しているCanvasを後から設定する
   */
  public setup(canvas: HTMLCanvasElement) {
    const parentElement = canvas.parentElement
    const width = parentElement?.clientWidth || canvas.width
    const height = parentElement?.clientHeight || canvas.height
    // renderer
    this._renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
    })
    this._renderer.setSize(width, height)
    this._renderer.setPixelRatio(window.devicePixelRatio)

    // camera
    this._camera = new THREE.PerspectiveCamera(20.0, width / height, 0.1, 20.0)
    this._camera.position.set(0, 1.3, 1.5)
    this._cameraControls?.target.set(0, 1.3, 0)
    this._cameraControls?.update()
    // camera controls
    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    )
    this._cameraControls.screenSpacePanning = true
    this._cameraControls.update()

    // Listen for position lock changes
    this._cameraControls.addEventListener('end', () => {
      if (!settingsStore.getState().fixedCharacterPosition) {
        this.saveCameraPosition()
      }
    })

    window.addEventListener('resize', () => {
      this.resize()
    })
    this.isReady = true
    this.update()

    // Restore saved position if available
    this.restoreCameraPosition()
  }

  /**
   * canvasの親要素を参照してサイズを変更する
   */
  public resize() {
    if (!this._renderer) return

    const parentElement = this._renderer.domElement.parentElement
    if (!parentElement) return

    this._renderer.setPixelRatio(window.devicePixelRatio)
    this._renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    )

    if (!this._camera) return
    this._camera.aspect = parentElement.clientWidth / parentElement.clientHeight
    this._camera.updateProjectionMatrix()
  }

  /**
   * VRMのheadノードを参照してカメラ位置を調整する
   */
  public resetCamera() {
    const { fixedCharacterPosition } = settingsStore.getState()
    // If position is fixed, restore saved position instead of auto-adjusting
    if (fixedCharacterPosition) {
      this.restoreCameraPosition()
      return
    }

    const headNode = this.model?.vrm?.humanoid.getNormalizedBoneNode('head')

    if (headNode) {
      const headWPos = headNode.getWorldPosition(new THREE.Vector3())
      this._camera?.position.set(
        this._camera.position.x,
        headWPos.y,
        this._camera.position.z
      )
      this._cameraControls?.target.set(headWPos.x, headWPos.y, headWPos.z)
      this._cameraControls?.update()
    }
  }

  public update = () => {
    requestAnimationFrame(this.update)
    const delta = this._clock.getDelta()
    // update vrm components
    if (this.model) {
      this.model.update(delta)
    }

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera)
    }
  }

  /**
   * 現在のカメラ位置を設定に保存する
   */
  public saveCameraPosition() {
    if (!this._camera || !this._cameraControls) return

    const settings = settingsStore.getState()
    settingsStore.setState({
      characterPosition: {
        x: this._camera.position.x,
        y: this._camera.position.y,
        z: this._camera.position.z,
        scale: settings.characterPosition?.scale ?? 1,
      },
      characterRotation: {
        x: this._cameraControls.target.x,
        y: this._cameraControls.target.y,
        z: this._cameraControls.target.z,
      },
    })
  }

  /**
   * 保存されたカメラ位置を復元する
   */
  public restoreCameraPosition() {
    if (!this._camera || !this._cameraControls) return

    const { characterPosition, characterRotation, fixedCharacterPosition } =
      settingsStore.getState()

    if (
      fixedCharacterPosition &&
      (characterPosition.x !== 0 ||
        characterPosition.y !== 0 ||
        characterPosition.z !== 0)
    ) {
      this._camera.position.set(
        characterPosition.x,
        characterPosition.y,
        characterPosition.z
      )
      this._cameraControls.target.set(
        characterRotation.x,
        characterRotation.y,
        characterRotation.z
      )
      this._cameraControls.update()
    }
  }

  /**
   * カメラ位置を固定する
   */
  public fixCameraPosition() {
    this.saveCameraPosition()
    settingsStore.setState({ fixedCharacterPosition: true })
    if (this._cameraControls) {
      this._cameraControls.enabled = false
    }
  }

  /**
   * カメラ位置の固定を解除する
   */
  public unfixCameraPosition() {
    settingsStore.setState({ fixedCharacterPosition: false })
    if (this._cameraControls) {
      this._cameraControls.enabled = true
    }
  }

  /**
   * カメラ位置をリセットする
   */
  public resetCameraPosition() {
    settingsStore.setState({
      fixedCharacterPosition: false,
      characterPosition: { x: 0, y: 0, z: 0, scale: 1 },
      characterRotation: { x: 0, y: 0, z: 0 },
    })
    if (this._cameraControls) {
      this._cameraControls.enabled = true
    }
    this.resetCamera()
  }

  /**
   * ライトの強度を更新する
   */
  public updateLightingIntensity(intensity: number) {
    if (this._directionalLight) {
      this._directionalLight.intensity = 1.8 * intensity
    }
    if (this._ambientLight) {
      this._ambientLight.intensity = 1.2 * intensity
    }
  }

  /**
   * VRMの状態をログ出力
   */
  public logVRMStatus() {
    if (!this.model?.vrm) {
      console.log('🤖 VRM: 未読み込み')
      return
    }

    const vrm = this.model.vrm
    const status = {
      hasExpressionManager: !!vrm.expressionManager,
      hasLookAt: !!vrm.lookAt,
      hasHumanoid: !!vrm.humanoid,
      expressionCount: Object.keys(
        vrm.expressionManager?._blendShapeGroups || {}
      ).length,
      emoteControllerStatus: this.model.emoteController
        ? 'available'
        : 'unavailable',
    }

    console.log('🤖 VRM状態:', status)

    // ExpressionControllerの状態も確認
    if (
      this.model.emoteController &&
      typeof (this.model.emoteController as any).getStatus === 'function'
    ) {
      const emoteStatus = (this.model.emoteController as any).getStatus()
      console.log('🎭 ExpressionController状態:', emoteStatus)
    }

    // LipSyncの状態も確認
    if (
      this.model._lipSync &&
      typeof (this.model._lipSync as any).getStatus === 'function'
    ) {
      const lipSyncStatus = (this.model._lipSync as any).getStatus()
      console.log('👄 LipSync状態:', lipSyncStatus)
    }
  }

  /**
   * システム全体の診断情報を出力
   */
  public performDiagnostics() {
    console.log('🔍 === VRMビューア診断開始 ===')

    console.log('📊 基本情報:', {
      isReady: this.isReady,
      hasRenderer: !!this._renderer,
      hasCamera: !!this._camera,
      hasCameraControls: !!this._cameraControls,
      hasScene: !!this._scene,
      hasModel: !!this.model,
      hasVRM: !!this.model?.vrm,
    })

    if (this._renderer) {
      console.log('🖼️ レンダラー情報:', {
        domElementWidth: this._renderer.domElement.width,
        domElementHeight: this._renderer.domElement.height,
        pixelRatio: this._renderer.getPixelRatio(),
      })
    }

    if (this._camera) {
      console.log('📷 カメラ情報:', {
        position: {
          x: this._camera.position.x,
          y: this._camera.position.y,
          z: this._camera.position.z,
        },
        fov: this._camera.fov,
        aspect: this._camera.aspect,
      })
    }

    this.logVRMStatus()

    // LipSyncの詳細診断
    if (
      this.model?._lipSync &&
      typeof (this.model._lipSync as any).logDetailedStatus === 'function'
    ) {
      ;(this.model._lipSync as any).logDetailedStatus()
    }

    console.log('🔍 === 診断完了 ===')
  }
}
