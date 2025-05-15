const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^canvas$': '<rootDir>/src/__mocks__/node-canvas.js',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  modulePathIgnorePatterns: [
    'node_modules/canvas',
    'node_modules/@ffmpeg-installer',
    'node_modules/fluent-ffmpeg',
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(canvas|@ffmpeg-installer|fluent-ffmpeg|three|@pixiv/three-vrm)).+\\.js$',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src/__mocks__'],
  testPathIgnorePatterns: ['/node_modules/', '/\\.next/'],
  setupFiles: ['<rootDir>/jest.setup.canvas.js'],
}

module.exports = createJestConfig(customJestConfig)
