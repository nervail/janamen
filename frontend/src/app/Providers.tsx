import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useTranslation } from 'react-i18next';
import { queryClient } from './queryClient';
import { theme } from '../theme';

// Календари Mantine на языке интерфейса, неделя с понедельника
function LocalizedDates({ children }: { children: ReactNode }) {
	const { i18n } = useTranslation();
	const language = i18n.resolvedLanguage ?? 'ru';
	const locale = language === 'kz' ? 'kk' : language;

	return (
		<DatesProvider settings={{ locale, firstDayOfWeek: 1 }}>
			{children}
		</DatesProvider>
	);
}

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme} defaultColorScheme='light'>
				<LocalizedDates>
					<Notifications position='top-right' />
					{children}
				</LocalizedDates>
			</MantineProvider>
			<ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-right' />
		</QueryClientProvider>
	);
}
