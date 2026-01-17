import { defineConfig } from 'vite';

export default defineConfig({
    // Si vas a publicar en github.io/repo-name/, cambia el base a '/repo-name/'
    base: '/private_notes/',
    build: {
        outDir: 'dist',
    },
    server: {
        port: 5173,
        strictPort: true,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        }
    }
});
