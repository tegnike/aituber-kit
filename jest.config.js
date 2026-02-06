/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: ['<rootDir>/jest.setup.canvas.js'],
  testEnvironment: 'jest-environment-jsdom',
  resolver: '<rootDir>/jest.resolver.js',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^canvas$': '<rootDir>/src/__mocks__/node-canvas.js',
    '^canvas/(.*)$': '<rootDir>/src/__mocks__/node-canvas.js',
    '^three/examples/jsm/(.*)$':
      '<rootDir>/src/__mocks__/three/examples/jsm/$1',
    // Next.js internal modules
    '^next/dist/(.*)$': '<rootDir>/node_modules/next/dist/$1',
    // Reactコンポーネントのモック
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  modulePathIgnorePatterns: [
    'node_modules/canvas',
    'node_modules/@ffmpeg-installer',
    'node_modules/fluent-ffmpeg',
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          module: 'commonjs',
          moduleResolution: 'node',
          resolveJsonModule: true,
          allowJs: true,
          strict: true,
          paths: {
            '@/*': ['./src/*'],
          },
          baseUrl: '.',
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@pixiv/three-vrm|three/examples/jsm|pdfjs-dist|i18next|idb))',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src/__mocks__'],
  testPathIgnorePatterns: ['/node_modules/', '/\\.next/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

module.exports = config
