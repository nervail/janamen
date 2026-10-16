import type { ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './queryClient';
import { theme } from '../theme';

export function Providers({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider theme={theme} defaultColorScheme='light'>
				<Notifications position='top-right' />
				{children}
			</MantineProvider>
			<ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-right' />
		</QueryClientProvider>
	);
}
