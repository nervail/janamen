import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { ME_QUERY_KEY } from '../api/auth';

function handleUnauthenticated(error: unknown) {
	if (error instanceof ApiError && error.status === 401) {
		queryClient.setQueryData(ME_QUERY_KEY, null);
	}
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({ onError: handleUnauthenticated }),
	mutationCache: new MutationCache({ onError: handleUnauthenticated }),
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			refetchOnWindowFocus: false,
			retry: (failureCount, error) => {
				// 4xx — ошибка запроса или прав, повтор не поможет
				if (
					error instanceof ApiError &&
					error.status >= 400 &&
					error.status < 500
				) {
					return false;
				}
				return failureCount < 1;
			},
		},
		mutations: {
			retry: false,
		},
	},
});
