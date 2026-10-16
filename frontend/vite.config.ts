import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Адрес nginx бэкенда в Docker. Согласуй порт с напарником.
const BACKEND_URL = 'http://localhost:8080';

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			'/api': { target: BACKEND_URL, changeOrigin: true },
			'/sanctum': { target: BACKEND_URL, changeOrigin: true },
		},
	},
});
