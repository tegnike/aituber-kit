export class GLTFLoader {
  constructor() {}

  load(url, onLoad, onProgress, onError) {
    setTimeout(() => {
      onLoad({
        scene: {},
        scenes: [],
        animations: [],
        cameras: [],
        asset: {},
        parser: {},
        userData: {},
      })
    }, 0)
  }

  loadAsync(url) {
    return Promise.resolve({
      scene: {},
      scenes: [],
      animations: [],
      cameras: [],
      asset: {},
      parser: {},
      userData: {},
    })
  }

  setDRACOLoader() {
    return this
  }

  setKTX2Loader() {
    return this
  }

  setMeshoptDecoder() {
    return this
  }

  register() {
    return this
  }

  unregister() {
    return this
  }

  setPath() {
    return this
  }

  setResourcePath() {
    return this
  }

  setCrossOrigin() {
    return this
  }
}
