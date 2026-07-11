import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import terser from '@rollup/plugin-terser';

/**
 * @param {object} options
 * @param {readonly string[]} options.external - Package names Rollup should
 *   not bundle (peer deps like `react`/`react-native`, and the workspace
 *   dependency on `react-fatless-form` for the web/native packages).
 * @returns {import('rollup').RollupOptions[]}
 */
export function createRollupConfig({ external }) {
  return [
    // JS build: ESM + CJS, no declarations here - the dts pass below handles those.
    {
      input: 'src/index.ts',
      external,
      output: [
        { file: 'dist/index.js', format: 'esm', sourcemap: true },
        { file: 'dist/index.cjs', format: 'cjs', sourcemap: true },
      ],
      plugins: [
        typescript({
          tsconfig: './tsconfig.json',
          declaration: false,
          declarationMap: false,
        }),
        terser()
      ],
    },
    // Types build: bundles every individual .d.ts produced from src/ into one
    // rolled-up dist/index.d.ts, matching the single JS entry point above.
    {
      input: 'src/index.ts',
      external,
      output: { file: 'dist/index.d.ts', format: 'esm' },
      plugins: [dts()],
    },
  ]
}
