import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	fetchProfile,
	PROFILE_QUERY_KEY,
	submitProfileCorrection,
} from '../api/profile';

export function useProfile() {
	return useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: fetchProfile });
}

export function useProfileCorrection() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: submitProfileCorrection,
		// Обращение — это заявка, список заявок нужно обновить
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
	});
}
