import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
	fetchLatestNotifications,
	fetchUnreadCount,
	markAllNotificationsRead,
	markNotificationRead,
	NOTIFICATIONS_LIST_QUERY_KEY,
	NOTIFICATIONS_QUERY_KEY,
	UNREAD_COUNT_QUERY_KEY,
} from '../api/notifications';
import type { AppNotification } from '../types/api';

export const POLL_INTERVAL_MS = 2_000;

export function useUnreadCount() {
	return useQuery({
		queryKey: UNREAD_COUNT_QUERY_KEY,
		queryFn: fetchUnreadCount,
		refetchInterval: POLL_INTERVAL_MS,
		// Вернулся на вкладку — сразу проверяем, не пришло ли что-то
		refetchOnWindowFocus: true,
	});
}

export function useLatestNotifications(enabled: boolean) {
	return useQuery({
		queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
		queryFn: fetchLatestNotifications,
		enabled,
		staleTime: 0,
	});
}

export function useMarkNotificationRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: markNotificationRead,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
	});
}

export function useMarkAllNotificationsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: markAllNotificationsRead,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
	});
}

// Текст уведомления на текущем языке
// Текст уведомления на текущем языке
export function useNotificationText() {
	const { t } = useTranslation();
	return (n: AppNotification) => {
		const status = n.params.status;
		// HR и руководителю бэкенд присылает имя сотрудника, который прошёл курс
		const key =
			n.event === 'course_completed' && n.params.employee_name
				? 'course_completed_by'
				: n.event;
		return t(`notifications.${key}`, {
			...n.params,
			statusLabel: status ? t(`requestStatus.${status}`) : '',
			defaultValue: t('notifications.unknown'),
		});
	};
}

// Куда ведёт клик по уведомлению
export function notificationLink(n: AppNotification): string | null {
	if (!n.link) return null;
	return n.link.entity_type === 'course'
		? `/courses/${n.link.entity_id}`
		: `/requests/${n.link.entity_id}`;
}
