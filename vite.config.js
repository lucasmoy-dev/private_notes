import { defineConfig } from 'vite';

export default defineConfig({
    // Si vas a publicar en github.io/repo-name/, cambia el base a '/repo-name/'
    base: '/laboratory/',
    build: {
        outDir: 'dist',
    },
    server: {
        port: 5173,
        strictPort: true,
    }
});
