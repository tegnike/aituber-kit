export class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera
    this.domElement = domElement
    this.enabled = true
    this.target = { set: () => {}, copy: () => {} }
  }

  update() {}
  dispose() {}
  reset() {}
  saveState() {}

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
}
