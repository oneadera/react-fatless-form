const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Let Metro see the whole monorepo, not just this example's own folder -
// needed so it picks up changes in packages/native and packages/core, and
// so file-watching works across the workspace boundary at all.
config.watchFolders = [workspaceRoot]

// With node-modules linker, Yarn workspaces hoists shared dependencies up
// to the repo root's node_modules rather than duplicating them inside
// examples/native/node_modules. Metro needs to know to look in both places.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
