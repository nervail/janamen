import type { Role } from '../types/api';

export const DEMO_PASSWORD = 'password';

export const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
	{ role: 'employee', email: 'a.seitkali@janapost.demo' },
	{ role: 'manager', email: 'e.akhmetov@janapost.demo' },
	{ role: 'hr', email: 'g.nurlanova@janapost.demo' },
];
