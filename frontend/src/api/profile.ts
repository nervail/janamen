import { api } from './client';
import type { DataResponse, Profile } from '../types/api';

export const PROFILE_QUERY_KEY = ['profile'] as const;

export async function fetchProfile(): Promise<Profile> {
	const { data } = await api.get<DataResponse<Profile>>('/profile');
	return data.data;
}

export async function submitProfileCorrection(message: string): Promise<void> {
	await api.post('/profile/corrections', { message });
}
