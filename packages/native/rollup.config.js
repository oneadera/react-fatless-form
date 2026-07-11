import { createRollupConfig } from '../../rollup.config.base.mjs'

export default createRollupConfig({
  external: ['react', 'react-native', 'react-fatless-form'],
})
