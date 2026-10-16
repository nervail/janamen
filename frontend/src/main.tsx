import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import './i18n';
import { Providers } from './app/Providers';
import App from './App';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Providers>
			<App />
		</Providers>
	</StrictMode>,
);
