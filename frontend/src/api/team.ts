import { api } from './client';
import type { TeamEmployee } from '../types/api';

export const TEAM_QUERY_KEY = ['team'] as const;

export async function fetchTeamEmployees(): Promise<TeamEmployee[]> {
	const { data } = await api.get<{ data: TeamEmployee[] }>('/team/employees');
	return data.data;
}
