const defaultAnimationUrl = buildUrl('/idle_loop.vrma')
import * as THREE from 'three'
import { Model } from './model'
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation'
import { buildUrl } from '@/utils/buildUrl'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { loadMixamoAnimation } from '@/lib/VRMAnimation/loadMixamoAnimation' // いったんコメントアウト

/**
 * three.js を使用した 3D ビューア
 *
 * setup() で canvas を渡してから使用
 */
export class Viewer {
  public isReady: boolean
  public model?: Model
  private readonly idleAnimationName = 'idle_default' // アイドルアニメーションのデフォルト名
  private readonly defaultIdleAnimationPath = '/idle_loop.vrma' // デフォルトアイドルアニメーションのパス

  private _renderer?: THREE.WebGLRenderer
  private _clock: THREE.Clock
  private _scene: THREE.Scene
  private _camera?: THREE.PerspectiveCamera
  private _cameraControls?: OrbitControls

  private _currentAnimationUrl: string
  private _currentAnimationType: string

  constructor() {
    // current animation
    this._currentAnimationUrl = defaultAnimationUrl
    this._currentAnimationType = 'vrma'

    this.isReady = false

    // scene
    const scene = new THREE.Scene()
    this._scene = scene

    // light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8)
    directionalLight.position.set(1.0, 1.0, 1.0).normalize()
    scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

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
      this.model.setIdleAnimationName(this.idleAnimationName) // アイドルアニメーション名を設定

      // Load and play default idle animation
      // _currentAnimationUrl と _currentAnimationType はデフォルトアイドルアニメーションのパスとタイプとして解釈
      // 将来的には settingsStore などから取得するのが良いと想定
      this._currentAnimationUrl = buildUrl(this.defaultIdleAnimationPath)
      this._currentAnimationType = 'vrma'

      if (this._currentAnimationUrl && this._currentAnimationType === 'vrma') {
        try {
          const vrma = await loadVRMAnimation(this._currentAnimationUrl) // buildUrl で処理されたパスを使用
          if (vrma && this.model) {
            await this.model.loadAnimation(vrma, this.idleAnimationName)
            this.model.playAnimation(this.idleAnimationName, THREE.LoopRepeat)
            console.log(
              `Default animation '${this.idleAnimationName}' loaded and playing.`
            )

            // アイドルアニメーションをロードした後、他の感情アニメーションもロード
            await this.model.loadAllEmotionAnimations()
          } else {
            console.warn(
              'Failed to load default VRMA animation or model not ready.'
            )
          }
        } catch (error) {
          console.error('Error loading default VRMA animation:', error)
        }
      } else {
        // FBXアイドルの処理は変更されません。まだ実装されていません。
        console.warn(
          'Default FBX idle animation not implemented or path not set for VRMA.'
        )
      }

      // HACK: アニメーションの原点に誤差があるため、後処理でカメラ位置を調整します。
      requestAnimationFrame(() => {
        this.resetCamera()
      })
    })
  }

  public unloadVRM(): void {
    if (this.model?.vrm) {
      this._scene.remove(this.model.vrm.scene)
      this.model?.resetAnimations() // Unload時にアニメーションもリセット
      this.model?.unLoadVrm()
      this.model = undefined
    }
  }

  public async loadVrma(
    url: string,
    animationName?: string,
    loop: boolean = true
  ) {
    if (!this.model?.vrm) {
      console.warn('VRM model not loaded. Cannot load VRMA animation.')
      return
    }
    const nameToLoad = animationName || `vrma_${Date.now()}` // 適切な名前を生成
    // this._currentAnimationUrl = url // 最後にロードしたURLを維持する必要性は減りました。
    // this._currentAnimationType = 'vrma'

    try {
      const vrma = await loadVRMAnimation(url)
      if (vrma && this.model) {
        await this.model.loadAnimation(vrma, nameToLoad)
        this.model.crossFadeToAnimation(
          nameToLoad,
          0.5,
          loop ? THREE.LoopRepeat : THREE.LoopOnce
        )
        console.log(
          `VRMA animation '${nameToLoad}' loaded and playing with crossfade (loop: ${loop}).`
        )
      } else {
        console.warn(`Failed to load VRMA from ${url} or model not ready.`)
      }
    } catch (error) {
      console.error(`Error loading VRMA animation from ${url}:`, error)
    }
  }

  public async loadFbx(
    url: string,
    animationName?: string,
    loop: boolean = true
  ) {
    if (!this.model?.vrm) {
      console.warn('VRM model not loaded. Cannot load FBX animation.')
      return
    }
    // const nameToLoad = animationName || `fbx_${Date.now()}` // 適切な名前を生成
    // this._currentAnimationUrl = url
    // this._currentAnimationType = 'fbx'

    console.warn(
      'loadMixamoAnimation is not implemented yet. FBX animation loading skipped.'
    )
    // try {
    //   // const clip = await loadMixamoAnimation(url, this.model.vrm) // loadMixamoAnimation が Promise を返すものとして想定
    //   // if (clip && this.model) {
    //   //   await this.model.loadFbxAnimation(clip, nameToLoad)
    //   //   this.model.crossFadeToAnimation(nameToLoad, 0.5, loop ? THREE.LoopRepeat : THREE.LoopOnce)
    //   //   console.log(`FBX animation '${nameToLoad}' loaded and playing with crossfade (loop: ${loop}).`)
    //   // } else {
    //   //   console.warn(`Failed to load FBX from ${url} or model not ready.`)
    //   // }
    // } catch (error) {
    //   console.error(`Error loading FBX animation from ${url}:`, error)
    // }
  }

  /**
   * 指定された感情のアニメーションを再生します。
   * @param emotionName 再生する感情の名前 (例: "happy", "sad")
   * @param crossFadeDuration フェード時間 (秒)
   */
  public playEmotionAnimation(
    emotionName: string,
    crossFadeDuration: number = 0.3
  ) {
    if (this.model) {
      this.model.playEmotionAnimation(emotionName, crossFadeDuration)
    } else {
      console.warn('Model not loaded. Cannot play emotion animation.')
    }
  }

  /**
   * React で管理する Canvas を後で設定する
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

    window.addEventListener('resize', () => {
      this.resize()
    })
    this.isReady = true
    this.update()
  }

  /**
   * canvas の親要素を参照してサイズを変更します。
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
   * VRM の head ノードを参照してカメラ位置を調整します。
   */
  public resetCamera() {
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
   * アイドルアニメーションに切り替える
   * @param crossFadeDuration クロスフェード時間 (秒)
   */
  public switchToIdleAnimation(crossFadeDuration: number = 0.3) {
    if (this.model) {
      this.model.returnToIdleAnimation(crossFadeDuration)
    } else {
      console.warn('Model not loaded. Cannot switch to idle animation.')
    }
  }
}
