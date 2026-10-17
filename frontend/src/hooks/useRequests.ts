import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import {
	createVacationRequest,
	fetchMyRequests,
	fetchRequest,
	performRequestAction,
	requestQueryKey,
	REQUESTS_QUERY_KEY,
	fetchTeamRequests,
	fetchHrRequests,
	type RequestActionInput,
	type RequestListParams,
	type HrRequestListParams,
} from '../api/requests';
import { ApiError } from '../api/client';
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
export function useRequest(id: number) {
	return useQuery({
		queryKey: requestQueryKey(id),
		queryFn: () => fetchRequest(id),
		enabled: Number.isInteger(id) && id > 0,
	});
}

export function useRequestAction(id: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: RequestActionInput) => performRequestAction(id, input),
		onSuccess: detail => {
			// Ответ уже содержит обновлённую карточку — кладём его в кэш без лишнего запроса
			queryClient.setQueryData(requestQueryKey(id), detail);
			// Действие меняет списки, очереди, остаток отпуска и уведомления
			void queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
			void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
			void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
			void queryClient.invalidateQueries({ queryKey: ['notifications'] });
			void queryClient.invalidateQueries({ queryKey: ['team'] });
		},
		onError: error => {
			// 409: заявку уже изменил кто-то другой — подтягиваем актуальное состояние
			if (error instanceof ApiError && error.status === 409) {
				void queryClient.invalidateQueries({ queryKey: requestQueryKey(id) });
			}
		},
	});
}
export function useTeamRequests(params: RequestListParams, enabled = true) {
	return useQuery({
		queryKey: [...REQUESTS_QUERY_KEY, 'team', params],
		queryFn: () => fetchTeamRequests(params),
		placeholderData: keepPreviousData,
		enabled,
	});
}

export function useHrRequests(params: HrRequestListParams, enabled = true) {
	return useQuery({
		queryKey: [...REQUESTS_QUERY_KEY, 'hr', params],
		queryFn: () => fetchHrRequests(params),
		placeholderData: keepPreviousData,
		enabled,
	});
}
