import { createRollupConfig } from '../../rollup.config.base.mjs'

export default createRollupConfig({
  external: ['react', 'react-fatless-form'],
})
