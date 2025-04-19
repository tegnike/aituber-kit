const Canvas = jest.fn(() => ({
  getContext: jest.fn(() => ({
    measureText: jest.fn(() => ({ width: 0 })),
    fillText: jest.fn(),
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    putImageData: jest.fn(),
    getImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
  })),
  toBuffer: jest.fn(() => Buffer.from([])),
  toDataURL: jest.fn(() => ''),
  width: 100,
  height: 100,
}))

const createCanvas = jest.fn((width, height) => {
  const canvas = new Canvas()
  canvas.width = width || 100
  canvas.height = height || 100
  return canvas
})

const Image = jest.fn(function () {
  this.src = ''
  this.onload = null
  this.width = 0
  this.height = 0
})

const loadImage = jest.fn(() => Promise.resolve(new Image()))

module.exports = {
  Canvas,
  createCanvas,
  loadImage,
  Image,
  registerFont: jest.fn(),
  parseFont: jest.fn(),
  createImageData: jest.fn(),
  ImageData: jest.fn(),
  PNGStream: jest.fn(),
  JPEGStream: jest.fn(),
  PDFStream: jest.fn(),
}
