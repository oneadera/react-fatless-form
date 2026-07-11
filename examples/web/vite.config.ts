import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve straight to source, not to dist/ (which only exists after
      // `rollup -c` has run). Real consumers outside this monorepo always
      // get dist/ via normal npm resolution - this alias only affects how
      // *this example* resolves its own workspace siblings during local
      // development, and is intentionally not something a published
      // package can rely on.
      'react-fatless-form-web': fileURLToPath(
        new URL('../../packages/web/src/index.ts', import.meta.url),
      ),
      'react-fatless-form': fileURLToPath(
        new URL('../../packages/core/src/index.ts', import.meta.url),
      ),
    },
  },
})
