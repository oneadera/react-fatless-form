// Named `.cjs` for the same reason as babel.config.cjs - unambiguous
// CommonJS regardless of `"type": "module"` in package.json.
//
// Tests live in __tests__/, outside src/, so they're never picked up by
// this package's own tsconfig.json (`include: ["src"]`) and therefore never
// touched by the `build` or `typecheck` scripts.
/** @type {import('jest').Config} */
module.exports = {
  displayName: 'react-fatless-form',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/__tests__/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageProvider: 'v8',
}
