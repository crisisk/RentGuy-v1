import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@application': path.resolve(__dirname, 'src/application'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@infra': path.resolve(__dirname, 'src/infrastructure'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@errors': path.resolve(__dirname, 'src/errors'),
      '@router': path.resolve(__dirname, 'src/router'),
      '@stores': path.resolve(__dirname, 'src/stores'),
      '@rg-types': path.resolve(__dirname, 'src/types'),
      'react-router-dom': path.resolve(__dirname, 'src/vendor/react-router-dom.tsx'),
      zustand: path.resolve(__dirname, 'src/vendor/zustand.ts'),
      'zustand/middleware/immer': path.resolve(__dirname, 'src/vendor/zustand-immer.ts'),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
  },
})
