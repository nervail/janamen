import type { Me } from '../types/api';

type RedirectState = { from?: string; userId?: number | null } | null;

// Куда вести после входа. На прежнюю страницу — только если вошёл тот же пользователь
// или прошлый неизвестен (открыли ссылку в новой вкладке). Иначе на главную
export function redirectAfterLogin(state: unknown, me: Me): string {
	const { from, userId } = (state as RedirectState) ?? {};
	if (!from) return '/';
	return userId == null || userId === me.id ? from : '/';
}
