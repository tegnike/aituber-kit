export class GLTFLoader {
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

  setDRACOLoader(dracoLoader) {
    return this
  }

  setKTX2Loader(ktx2Loader) {
    return this
  }

  setMeshoptDecoder(decoder) {
    return this
  }

  register(plugin) {
    return this
  }

  unregister(plugin) {
    return this
  }

  setPath(path) {
    return this
  }

  setResourcePath(path) {
    return this
  }

  setCrossOrigin(crossOrigin) {
    return this
  }
}
