import * as THREE from 'three'
import { Model } from './model'
import { loadVRMAnimation } from '@/lib/VRMAnimation/loadVRMAnimation'
import { buildUrl } from '@/utils/buildUrl'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import settingsStore from '@/features/stores/settings'

/**
 * three.js郢ｧ蜑・ｽｽ・ｿ邵ｺ・｣邵ｺ繝ｻD郢晁侭ﾎ礼ｹ晢ｽｼ郢晢ｽｯ郢晢ｽｼ
 *
 * setup()邵ｺ・ｧcanvas郢ｧ蜻茨ｽｸ・｡邵ｺ蜉ｱ窶ｻ邵ｺ荵晢ｽ芽抄・ｿ邵ｺ繝ｻ
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
  private _mobileInteractionMode = false

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
    this.model
      .loadVRM(url)
      .then(async () => {
        if (!this.model?.vrm) return

        // Disable frustum culling
        this.model.vrm.scene.traverse((obj) => {
          obj.frustumCulled = false
        })

        this.model.vrm.scene.visible = false
        this._scene.add(this.model.vrm.scene)

        try {
          const vrma = await loadVRMAnimation(buildUrl('/idle_loop.vrma'))
          if (vrma) this.model.loadAnimation(vrma)
        } finally {
          this.model.vrm.scene.visible = true
        }

        // HACK: 郢ｧ・｢郢昜ｹ斟鍋ｹ晢ｽｼ郢ｧ・ｷ郢晢ｽｧ郢晢ｽｳ邵ｺ・ｮ陷ｴ貅ｽ縺帷ｸｺ蠕娯・郢ｧ蠕娯ｻ邵ｺ繝ｻ・狗ｸｺ・ｮ邵ｺ・ｧ陷蜥ｲ蜃ｽ陟募ｾ娯・郢ｧ・ｫ郢晢ｽ｡郢晢ｽｩ闖ｴ蜥ｲ・ｽ・ｮ郢ｧ螳夲ｽｪ・ｿ隰ｨ・ｴ邵ｺ蜷ｶ・・
        requestAnimationFrame(() => {
          this.resetCamera()
        })
      })
      .catch((error) => {
        console.error('Failed to load VRM model:', error)
      })
  }

  public unloadVRM(): void {
    if (this.model?.vrm) {
      this._scene.remove(this.model.vrm.scene)
      this.model?.unLoadVrm()
    }
  }

  /**
   * React邵ｺ・ｧ驍ゑｽ｡騾・・・邵ｺ・ｦ邵ｺ繝ｻ・気anvas郢ｧ雋橸ｽｾ蠕個ｰ郢ｧ闃ｽ・ｨ・ｭ陞ｳ螢ｹ笘・ｹｧ繝ｻ
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
    this.configureInteractionMode(this._mobileInteractionMode)
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
   * canvas邵ｺ・ｮ髫包ｽｪ髫補悪・ｴ・ｰ郢ｧ雋樒崟霎｣・ｧ邵ｺ蜉ｱ窶ｻ郢ｧ・ｵ郢ｧ・､郢ｧ・ｺ郢ｧ雋橸ｽ､逕ｻ蟲ｩ邵ｺ蜷ｶ・・
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
   * VRM邵ｺ・ｮhead郢晏ｼｱ繝ｻ郢晏ｳｨ・定愾繧峨・邵ｺ蜉ｱ窶ｻ郢ｧ・ｫ郢晢ｽ｡郢晢ｽｩ闖ｴ蜥ｲ・ｽ・ｮ郢ｧ螳夲ｽｪ・ｿ隰ｨ・ｴ邵ｺ蜷ｶ・・
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
   * 霑ｴ・ｾ陜ｨ・ｨ邵ｺ・ｮ郢ｧ・ｫ郢晢ｽ｡郢晢ｽｩ闖ｴ蜥ｲ・ｽ・ｮ郢ｧ螳夲ｽｨ・ｭ陞ｳ螢ｹ竊楢将譎擾ｽｭ蛟･笘・ｹｧ繝ｻ
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
   * 闖ｫ譎擾ｽｭ蛟･・・ｹｧ蠕娯螺郢ｧ・ｫ郢晢ｽ｡郢晢ｽｩ闖ｴ蜥ｲ・ｽ・ｮ郢ｧ雋橸ｽｾ・ｩ陷医・笘・ｹｧ繝ｻ
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
   * 郢ｧ・ｫ郢晢ｽ｡郢晢ｽｩ闖ｴ蜥ｲ・ｽ・ｮ郢ｧ雋槫ｴ玖楜螢ｹ笘・ｹｧ繝ｻ
   */
  public fixCameraPosition() {
    this.saveCameraPosition()
    settingsStore.setState({ fixedCharacterPosition: true })
    if (this._cameraControls) {
      this._cameraControls.enabled = false
    }
  }

  /**
   * 郢ｧ・ｫ郢晢ｽ｡郢晢ｽｩ闖ｴ蜥ｲ・ｽ・ｮ邵ｺ・ｮ陜暦ｽｺ陞ｳ螢ｹ・帝囓・｣鬮ｯ・､邵ｺ蜷ｶ・・
   */
  public unfixCameraPosition() {
    settingsStore.setState({ fixedCharacterPosition: false })
    if (this._cameraControls) {
      this._cameraControls.enabled = true
    }
  }

  /**
   * 郢ｧ・ｫ郢晢ｽ｡郢晢ｽｩ闖ｴ蜥ｲ・ｽ・ｮ郢ｧ蛛ｵﾎ懃ｹｧ・ｻ郢昴・繝ｨ邵ｺ蜷ｶ・・
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

  public setMobileInteractionMode(enabled: boolean) {
    this._mobileInteractionMode = enabled
    this.configureInteractionMode(enabled)
  }

  public setControlsEnabled(enabled: boolean) {
    if (!this._cameraControls) return
    this._cameraControls.enabled = enabled
  }

  private configureInteractionMode(isMobileMode: boolean) {
    if (!this._cameraControls) return

    this._cameraControls.enablePan = true
    this._cameraControls.enableZoom = true
    this._cameraControls.enableRotate = true

    if (isMobileMode) {
      this._cameraControls.touches.ONE = THREE.TOUCH.PAN
      this._cameraControls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE
      this._cameraControls.rotateSpeed = 0.7
      this._cameraControls.panSpeed = 1.1
      this._cameraControls.zoomSpeed = 1.0
    } else {
      this._cameraControls.touches.ONE = THREE.TOUCH.ROTATE
      this._cameraControls.touches.TWO = THREE.TOUCH.DOLLY_PAN
      this._cameraControls.rotateSpeed = 1.0
      this._cameraControls.panSpeed = 1.0
      this._cameraControls.zoomSpeed = 1.0
    }
  }

  /**
   * 郢晢ｽｩ郢ｧ・､郢晏現繝ｻ陟托ｽｷ陟趣ｽｦ郢ｧ蜻亥ｳｩ隴・ｽｰ邵ｺ蜷ｶ・・
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
