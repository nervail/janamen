import { api } from './client';
import type { Department } from '../types/api';

export const HR_QUERY_KEY = ['hr'] as const;

export async function fetchDepartments(): Promise<Department[]> {
	const { data } = await api.get<{ data: Department[] }>('/hr/departments');
	return data.data;
}
