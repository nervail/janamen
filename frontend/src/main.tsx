import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import './i18n';
import { Providers } from './app/Providers';
import App from './App';

async function enableMocking() {
	if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return;

	const { worker } = await import('./mocks/browser');
	await worker.start({
		onUnhandledFrame({ frame, defaults }) {
			// MSW 3 обрабатывает и HTTP, и WebSocket. Нас интересует только HTTP
			if (frame.protocol !== 'http') return;

			const request = (frame.data as { request?: Request }).request;
			if (!request) return;

			const { pathname } = new URL(request.url);
			// Предупреждаем только о запросах к API, без мока они уйдут на бэкенд
			if (pathname.startsWith('/api') || pathname.startsWith('/sanctum')) {
				defaults.warn();
			}
		},
	});
}

enableMocking().then(() => {
	createRoot(document.getElementById('root')!).render(
		<StrictMode>
			<Providers>
				<App />
			</Providers>
		</StrictMode>,
	);
});
