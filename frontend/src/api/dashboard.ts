import { api } from './client';
import type { Dashboard, DataResponse } from '../types/api';

export const DASHBOARD_QUERY_KEY = ['dashboard'] as const;

export async function fetchDashboard(): Promise<Dashboard> {
	const { data } = await api.get<DataResponse<Dashboard>>('/dashboard');
	return data.data;
}
