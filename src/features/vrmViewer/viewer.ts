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
    if (this.model?.vrm) {
      this.unloadVRM()
    }

    // gltf and vrm
    this.model = new Model(this._camera || new THREE.Object3D())
    this.model.loadVRM(url).then(async () => {
      if (!this.model?.vrm) return

      // Disable frustum culling
      this.model.vrm.scene.traverse((obj) => {
        obj.frustumCulled = false
      })

      this._scene.add(this.model.vrm.scene)

      const vrma = await loadVRMAnimation(buildUrl('/idle_loop.vrma'))
      if (vrma) this.model.loadAnimation(vrma)

      // HACK: アニメーションの原点がずれているので再生後にカメラ位置を調整する
      requestAnimationFrame(() => {
        this.resetCamera()
      })
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

  private _breathingAmplitude: number = 0.005 // 呼吸の振幅（大きさ）
  private _breathingFrequency: number = 0.2 // 呼吸の周波数（速さ）
  private _breathingTime: number = 0 // 呼吸のタイマー

  public update = () => {
    requestAnimationFrame(this.update)
    const delta = this._clock.getDelta()

    // VRMコンポーネントを更新
    if (this.model) {
      this.model.update(delta)
      this.updateBreathing(delta) // 呼吸運動を更新
      this.lowerArms() // 腕を下げる
    }

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera)
    }
  }

  private lowerArms() {
    if (!this.model?.vrm) return

    const rightArm = this.model.vrm.humanoid.getRawBoneNode('rightUpperArm')
    const leftArm = this.model.vrm.humanoid.getRawBoneNode('leftUpperArm')

    // より自然な腕の角度に調整（Tポーズから自然な立ち姿に）
    if (rightArm) {
      rightArm.rotation.z = -Math.PI / 2.5 // 右腕を下に60度
    }
    if (leftArm) {
      leftArm.rotation.z = Math.PI / 2.5 // 左腕を下に60度
    }

    // // 拳を握らせる
    // this.makeHandsFist()
  }

  private makeHandsFist() {
    if (!this.model?.vrm) return

    // 親指を曲げる（全関節）
    const thumbParts = ['Proximal', 'Intermediate', 'Distal']
    thumbParts.forEach((part) => {
      const rightThumb = this.model?.vrm?.humanoid.getRawBoneNode(
        `rightThumb${part}` as any
      )
      const leftThumb = this.model?.vrm?.humanoid.getRawBoneNode(
        `leftThumb${part}` as any
      )
      if (rightThumb) {
        rightThumb.rotation.x = -Math.PI / 6 // 右親指を内側に45度
        rightThumb.rotation.z = -Math.PI / 6 // 関節も少し曲げる
      }
      if (leftThumb) {
        leftThumb.rotation.x = -Math.PI / 6 // 左親指を内側に45度
        leftThumb.rotation.z = Math.PI / 6 // 関節も少し曲げる
      }
    })

    // 他の4本の指を曲げる（全関節）
    const fingerParts = ['Proximal', 'Intermediate', 'Distal']
    const fingerTypes = ['Index', 'Middle', 'Ring', 'Little']

    fingerTypes.forEach((fingerType) => {
      fingerParts.forEach((part) => {
        const rightFinger = this.model?.vrm?.humanoid.getRawBoneNode(
          `right${fingerType}${part}` as any
        )
        const leftFinger = this.model?.vrm?.humanoid.getRawBoneNode(
          `left${fingerType}${part}` as any
        )

        if (rightFinger) rightFinger.rotation.z = -Math.PI / 6 // 右手の指を60度曲げる
        if (leftFinger) leftFinger.rotation.z = Math.PI / 6 // 左手の指を60度曲げる
      })
    })
  }

  private updateBreathing(delta: number) {
    if (!this.model?.vrm) return

    const chest = this.model.vrm.humanoid.getRawBoneNode('chest')
    const spine = this.model.vrm.humanoid.getRawBoneNode('spine')
    const upperChest = this.model.vrm.humanoid.getRawBoneNode('upperChest')

    if (chest && spine && upperChest) {
      this._breathingTime += delta
      const swayAngle =
        Math.sin(this._breathingTime * Math.PI * 2 * this._breathingFrequency) *
        this._breathingAmplitude
      chest.rotation.z = swayAngle
      spine.rotation.z = swayAngle
      upperChest.rotation.z = swayAngle
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
}
