// See packages/core/babel.config.cjs for the full rationale. Note this is
// used ONLY to transpile this package's own src/__tests__ TypeScript for
// Jest - it is deliberately NOT the React Native babel preset. None of this
// package's source actually renders React Native components (no JSX using
// `<TextInput>`/`<Switch>`/etc.), so the plain React preset is sufficient;
// `react-native` itself is mocked in tests rather than genuinely loaded (see
// jest.config.cjs and each test file's `jest.mock('react-native', ...)`).
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
}
