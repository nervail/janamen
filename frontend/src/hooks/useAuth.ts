import i18n, { consumeExplicitLocaleChoice } from '../i18n';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	fetchMe,
	login,
	logout,
	ME_QUERY_KEY,
	updateLocale,
} from '../api/auth';
import type { Locale } from '../types/api';

export function useMe() {
	return useQuery({
		queryKey: ME_QUERY_KEY,
		queryFn: fetchMe,
		staleTime: 5 * 60_000,
	});
}

export function useLogin() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (payload: { email: string; password: string }) => {
			const me = await login(payload);
			const current = i18n.resolvedLanguage as Locale | undefined;

			// Язык выбран вручную на странице входа — сохраняем его в профиль
			if (consumeExplicitLocaleChoice() && current && current !== me.locale) {
				try {
					return await updateLocale(current);
				} catch {
					return me;
				}
			}
			return me;
		},
		onSuccess: me => queryClient.setQueryData(ME_QUERY_KEY, me),
	});
}

export function useLogout() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: logout,
		// Даже если запрос не дошёл, локально считаем, что вышли
		onSettled: () => {
			queryClient.setQueryData(ME_QUERY_KEY, null);
			queryClient.removeQueries({
				predicate: q => q.queryKey[0] !== ME_QUERY_KEY[0],
			});
		},
	});
}

export function useUpdateLocale() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (locale: Locale) => updateLocale(locale),
		onSuccess: me => queryClient.setQueryData(ME_QUERY_KEY, me),
	});
}
