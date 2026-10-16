import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { theme } from './theme';
import './i18n';
import App from './App';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MantineProvider theme={theme} defaultColorScheme='light'>
			<Notifications position='top-right' />
			<App />
		</MantineProvider>
	</StrictMode>,
);
