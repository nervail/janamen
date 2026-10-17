import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import {
	createVacationRequest,
	fetchMyRequests,
	REQUESTS_QUERY_KEY,
	type RequestListParams,
} from '../api/requests';
import { PROFILE_QUERY_KEY } from '../api/profile';

export function useMyRequests(params: RequestListParams) {
	return useQuery({
		queryKey: [...REQUESTS_QUERY_KEY, 'mine', params],
		queryFn: () => fetchMyRequests(params),
		// При смене страницы или фильтра старые строки остаются на экране, пока грузятся новые
		placeholderData: keepPreviousData,
	});
}

export function useCreateVacationRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createVacationRequest,
		onSuccess: () => {
			// Новая заявка меняет список заявок и зарезервированные дни в профиле
			void queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
			void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
			void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
		},
	});
}
