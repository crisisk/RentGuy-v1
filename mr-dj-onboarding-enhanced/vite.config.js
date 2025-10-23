import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
const isAnalyzeEnabled = Boolean(process.env?.ANALYZE);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer for production builds
    isAnalyzeEnabled && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Enhanced performance optimizations
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        // Enhanced code splitting strategy
        manualChunks: {
          // Core vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          'icons-vendor': ['lucide-react'],
          
          // Authentication chunk
          'auth-chunk': [
            './src/auth/AuthContext',
            './src/auth/ProtectedRoute',
            './src/components/auth/Login'
          ],
          
          // Feature chunks - using relative paths
          'onboarding-core': [
            './src/components/OnboardingWizard',
            './src/components/ImprovedOnboardingWizard'
          ],
          'equipment-catalog': [
            './src/components/ImprovedEquipmentCatalogStep'
          ],
          'pricing-setup': [
            './src/components/ImprovedPricingSetupStep'
          ],
          
          // Performance monitoring chunk
          'performance-monitoring': [
            './src/performance/PerformanceMonitor',
            './src/performance/WebVitals'
          ]
        },
        // Optimize file naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
            : 'chunk'
          return `js/${facadeModuleId}-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      },
    },
    // Enhanced chunk size warnings
    chunkSizeWarningLimit: 800,
    // Enable source maps for production debugging (optional)
    sourcemap: false,
    // Asset inlining threshold
    assetsInlineLimit: 4096,
  },
  server: {
    // Development server optimizations
    hmr: {
      overlay: false,
    },
  },
  // Asset optimization
  assetsInclude: ['**/*.woff2', '**/*.woff'],
  
  // Performance budgets
  define: {
    __PERFORMANCE_BUDGET__: JSON.stringify({
      maxBundleSize: 1000000, // 1MB
      maxChunkSize: 500000,   // 500KB
    })
  }
})
