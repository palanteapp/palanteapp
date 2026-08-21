import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        // Only run the app's own tests — the repo root contains duplicate
        // node_modules copies ("node_modules 2", node_modules.nosync) and
        // .claude worktrees whose stray test files otherwise get picked up.
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.claude', 'dist'],
    },
    base: '/',
    server: {
        host: '0.0.0.0',
        port: 5201,
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
                    'pdf-worker': ['jspdf', 'html2canvas'],
                    'vendor-motion': ['framer-motion'],
                    'vendor-sentry': ['@sentry/react', '@sentry/capacitor'],
                    'vendor-analytics': ['posthog-js'],
                }
            }
        }
    }
})
