import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            },
            '/uploads': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    },
    build: {
        chunkSizeWarningLimit: 1000, // Increase limit as quick fix
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('xlsx')) {
                            return 'xlsx'; // Split xlsx into its own chunk
                        }
                        return 'vendor'; // All other node_modules in vendor
                    }
                }
            }
        }
    }
})
