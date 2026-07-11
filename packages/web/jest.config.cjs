/** @type {import('jest').Config} */
module.exports = {
  displayName: 'react-fatless-form-web',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/__tests__/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    // Mirrors this package's own tsconfig.json `paths` mapping (see
    // baseUrl/paths there): resolve the workspace dependency straight to
    // core's TypeScript source rather than its built `dist/`, so tests run
    // against source and never require `yarn build` first. `react-fatless-form`
    // is marked `external` in rollup.config.js for the same underlying reason
    // - this package never bundles core, it only ever consumes it.
    '^react-fatless-form$': '<rootDir>/../core/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageProvider: 'v8',
}
