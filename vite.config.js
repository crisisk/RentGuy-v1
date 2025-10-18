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
  build: {
    // Enhanced minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: true,
    },
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          'vendor-react': ['react', 'react/jsx-runtime'],
          // Router and state management
          'vendor-router': ['react-router-dom'],
          'vendor-state': ['zustand'],
        },
        // Naming patterns for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Tree-shaking optimization
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
      strictRequires: true,
      transformMixedEsModules: true,
    },
    // Performance settings
    target: 'es2015',
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 500,
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react/jsx-runtime', 'react-router-dom', 'zustand'],
  },
  // Enhanced esbuild settings
  esbuild: {
    target: 'es2015',
    legalComments: 'none',
  },
})
