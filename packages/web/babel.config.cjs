// See packages/core/babel.config.cjs for the full rationale (self-contained
// per-package config, `.cjs` extension for unambiguous CommonJS loading
// regardless of this package's own `"type": "module"`).
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
}
