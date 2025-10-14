import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const resolvePath = (dir: string) => path.resolve(__dirname, dir)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@core': resolvePath('src/core'),
      '@domain': resolvePath('src/domain'),
      '@infra': resolvePath('src/infrastructure'),
      '@ui': resolvePath('src/ui'),
      '@config': resolvePath('src/config'),
      zod: resolvePath('src/vendor/zod'),
    },
  },
})
