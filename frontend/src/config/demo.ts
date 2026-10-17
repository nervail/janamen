import type { Role } from '../types/api';

export const DEMO_PASSWORD = 'demo-password';

// Совпадает с сидами бэкенда
export const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
	{ role: 'employee', email: 'a.seitkali@janapost.demo' },
	{ role: 'employee', email: 'd.zhumabaev@janapost.demo' },
	{ role: 'employee', email: 't.bekov@janapost.demo' },
	{ role: 'employee', email: 'a.kim@janapost.demo' },
	{ role: 'manager', email: 'e.akhmetov@janapost.demo' },
	{ role: 'manager', email: 'director@janapost.demo' },
	{ role: 'hr', email: 'hr@janapost.demo' },
	{ role: 'hr', email: 'hr2@janapost.demo' },
	{ role: 'hr', email: 'hr.head@janapost.demo' },
];
