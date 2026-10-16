import { HttpResponse } from 'msw/http';
import type { ApiErrorResponse } from '../types/api';

export const API = '/api/v1';

export function apiError(
	status: number,
	code: string,
	message: string,
	fields?: Record<string, string[]>,
) {
	const body: ApiErrorResponse = {
		error: { code, message, ...(fields ? { fields } : {}) },
	};
	return HttpResponse.json(body, { status });
}
