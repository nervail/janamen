import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVacationRequest, REQUESTS_QUERY_KEY } from '../api/requests';
import { PROFILE_QUERY_KEY } from '../api/profile';

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
