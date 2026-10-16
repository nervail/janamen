import type { Me } from '../types/api';

export const DEMO_PASSWORD = 'password';

export const users: Me[] = [
	{
		id: 5,
		email: 'a.seitkali@janapost.demo',
		role: 'employee',
		locale: 'ru',
		employee: {
			id: 12,
			full_name: 'Сейткали Асель Маратовна',
			position: 'Специалист по логистике',
			department: { id: 3, name: 'Отдел логистики' },
		},
		abilities: { team: false, hr: false },
	},
	{
		id: 3,
		email: 'e.akhmetov@janapost.demo',
		role: 'manager',
		locale: 'ru',
		employee: {
			id: 4,
			full_name: 'Ахметов Ерлан Болатович',
			position: 'Руководитель отдела логистики',
			department: { id: 3, name: 'Отдел логистики' },
		},
		abilities: { team: true, hr: false },
	},
	{
		id: 2,
		email: 'g.nurlanova@janapost.demo',
		role: 'hr',
		locale: 'ru',
		employee: {
			id: 2,
			full_name: 'Нурланова Гульнара Сериковна',
			position: 'Руководитель HR-отдела',
			department: { id: 2, name: 'HR-отдел' },
		},
		abilities: { team: true, hr: true },
	},
];

const SESSION_KEY = 'janamen.mock.session';

// Имитация серверной сессии: сохраняется в localStorage, чтобы переживать F5
export const session = {
	get(): Me | null {
		const id = Number(localStorage.getItem(SESSION_KEY));
		return users.find(u => u.id === id) ?? null;
	},
	set(userId: number) {
		localStorage.setItem(SESSION_KEY, String(userId));
	},
	clear() {
		localStorage.removeItem(SESSION_KEY);
	},
};
