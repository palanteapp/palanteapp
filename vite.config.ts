import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    },
    base: '/',
    server: {
        host: '0.0.0.0',
        port: 5173,
    },
    plugins: [
        react(),
    ],
    optimizeDeps: {
        exclude: ['ios']
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    // React 19 is ESM-only — do NOT manually chunk react/react-dom
                    'vendor-supabase': ['@supabase/supabase-js'],
                    'vendor-lucide': ['lucide-react'],
                    'vendor-utils': ['uuid'],
                    'pdf-worker': ['jspdf', 'html2canvas'],
                }
            }
        }
    }
})
