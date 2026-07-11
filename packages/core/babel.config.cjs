// Babel config used ONLY by Jest (via babel-jest) to transpile TS/TSX test
// files to CommonJS for execution under Jest's require-based module system.
// This is intentionally separate from the package's actual build (Rollup +
// @rollup/plugin-typescript, see rollup.config.js) - production code is never
// touched by Babel. Named `.cjs` (not `.js`) so it's unambiguously loaded as
// CommonJS regardless of this package's own `"type": "module"`.
//
// Kept self-contained per-package (not shared from a root babel.config.cjs)
// so each package's test toolchain has no cross-directory config-resolution
// to reason about.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
}
