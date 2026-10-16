import { http, HttpResponse } from 'msw/http';
import { delay } from 'msw/utils/delay';
import type { Locale } from '../../types/api';
import { DEMO_PASSWORD, session, users } from '../db';
import { API, apiError } from '../utils';

const LOCALES: Locale[] = ['ru', 'kz', 'en'];

export const authHandlers = [
	http.get('/sanctum/csrf-cookie', async () => {
		await delay(150);
		document.cookie = 'XSRF-TOKEN=mock-token; path=/';
		return new HttpResponse(null, { status: 204 });
	}),

	http.post(`${API}/auth/login`, async ({ request }) => {
		await delay(500);
		const body = (await request.json()) as {
			email?: string;
			password?: string;
		};
		const email = body.email?.trim().toLowerCase() ?? '';
		const password = body.password ?? '';

		const fields: Record<string, string[]> = {};
		if (!email) fields.email = ['required'];
		if (!password) fields.password = ['required'];
		if (Object.keys(fields).length > 0) {
			return apiError(
				422,
				'validation_failed',
				'Проверьте заполнение полей',
				fields,
			);
		}

		const user = users.find(u => u.email === email);
		if (!user || password !== DEMO_PASSWORD) {
			return apiError(422, 'invalid_credentials', 'Неверный email или пароль');
		}

		session.set(user.id);
		return HttpResponse.json({ data: session.get() ?? user });
	}),

	http.post(`${API}/auth/logout`, async () => {
		await delay(200);
		session.clear();
		return new HttpResponse(null, { status: 204 });
	}),

	http.get(`${API}/me`, async () => {
		await delay(200);
		const user = session.get();
		if (!user) return apiError(401, 'unauthenticated', 'Требуется вход');
		return HttpResponse.json({ data: user });
	}),

	http.patch(`${API}/me`, async ({ request }) => {
		await delay(200);
		const user = session.get();
		if (!user) return apiError(401, 'unauthenticated', 'Требуется вход');

		const body = (await request.json()) as { locale?: string };
		if (!body.locale || !LOCALES.includes(body.locale as Locale)) {
			return apiError(422, 'validation_failed', 'Проверьте заполнение полей', {
				locale: ['invalid_value'],
			});
		}

		user.locale = body.locale as Locale;
		session.saveLocale(user.id, user.locale);
		return HttpResponse.json({ data: user });
	}),
];
