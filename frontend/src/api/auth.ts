import { api, ApiError, getCsrfCookie } from './client';
import type { DataResponse, Locale, Me } from '../types/api';

export const ME_QUERY_KEY = ['me'] as const;

export async function fetchMe(): Promise<Me | null> {
	try {
		const { data } = await api.get<DataResponse<Me>>('/me');
		return data.data;
	} catch (error) {
		// 401 — не ошибка, а «пользователь не вошёл»
		if (error instanceof ApiError && error.status === 401) return null;
		throw error;
	}
}

export async function login(payload: {
	email: string;
	password: string;
}): Promise<Me> {
	await getCsrfCookie();
	const { data } = await api.post<DataResponse<Me>>('/auth/login', payload);
	return data.data;
}

export async function logout(): Promise<void> {
	await api.post('/auth/logout');
}

export async function updateLocale(locale: Locale): Promise<Me> {
	const { data } = await api.patch<DataResponse<Me>>('/me', { locale });
	return data.data;
}

let previousUserId: number | null = null;

export function rememberPreviousUser(me: Me | null | undefined) {
	if (me) previousUserId = me.id;
}

export function getPreviousUserId() {
	return previousUserId;
}
