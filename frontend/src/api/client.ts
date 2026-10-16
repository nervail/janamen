import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import i18n from '../i18n';
import type { ApiErrorResponse } from '../types/api';

export class ApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly fields: Record<string, string[]>;

	constructor(
		status: number,
		code: string,
		message: string,
		fields: Record<string, string[]> = {},
	) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.code = code;
		this.fields = fields;
	}
}

const baseConfig = {
	withCredentials: true,
	withXSRFToken: true,
	headers: { Accept: 'application/json' },
};

export const api = axios.create({ baseURL: '/api/v1', ...baseConfig });
const sanctum = axios.create(baseConfig);

export function getCsrfCookie() {
	return sanctum.get('/sanctum/csrf-cookie');
}

api.interceptors.request.use(config => {
	config.headers['Accept-Language'] = i18n.resolvedLanguage ?? 'ru';
	return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _csrfRetried?: boolean };

function toApiError(error: AxiosError<ApiErrorResponse>): ApiError {
	if (!error.response) {
		return new ApiError(0, 'network_error', error.message);
	}
	const body = error.response.data?.error;
	return new ApiError(
		error.response.status,
		body?.code ?? 'server_error',
		body?.message ?? error.message,
		body?.fields ?? {},
	);
}

api.interceptors.response.use(
	response => response,
	async (error: unknown) => {
		if (!axios.isAxiosError<ApiErrorResponse>(error)) throw error;

		const config = error.config as RetriableConfig | undefined;
		const status = error.response?.status ?? 0;

		// CSRF-токен устарел: обновляем cookie и повторяем запрос один раз
		if (status === 419 && config && !config._csrfRetried) {
			config._csrfRetried = true;
			await getCsrfCookie();
			return api(config);
		}

		throw toApiError(error);
	},
);
