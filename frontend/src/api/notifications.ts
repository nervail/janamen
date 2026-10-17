import { api } from './client';
import type {
	AppNotification,
	DataResponse,
	Paginated,
	UnreadCount,
} from '../types/api';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const UNREAD_COUNT_QUERY_KEY = [
	...NOTIFICATIONS_QUERY_KEY,
	'unread-count',
] as const;
export const NOTIFICATIONS_LIST_QUERY_KEY = [
	...NOTIFICATIONS_QUERY_KEY,
	'list',
] as const;

export async function fetchUnreadCount(): Promise<UnreadCount> {
	const { data } = await api.get<DataResponse<UnreadCount>>(
		'/notifications/unread-count',
	);
	return data.data;
}

export async function fetchLatestNotifications(): Promise<AppNotification[]> {
	const { data } = await api.get<Paginated<AppNotification>>('/notifications', {
		params: { per_page: 10 },
	});
	return data.data;
}

export async function markNotificationRead(id: string): Promise<void> {
	await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
	await api.post('/notifications/read-all');
}
