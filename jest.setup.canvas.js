jest.mock('canvas', () => require('./src/__mocks__/node-canvas.js'), { virtual: true });

jest.mock('node-canvas', () => require('./src/__mocks__/node-canvas.js'), { virtual: true });
