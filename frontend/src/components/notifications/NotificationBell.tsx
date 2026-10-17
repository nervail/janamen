import { useEffect, useRef, useState } from 'react';
import {
	ActionIcon,
	Box,
	Button,
	Center,
	Group,
	Indicator,
	Loader,
	Popover,
	ScrollArea,
	Stack,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { notifications as toasts } from '@mantine/notifications';
import { IconBell } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
	fetchLatestNotifications,
	NOTIFICATIONS_LIST_QUERY_KEY,
} from '../../api/notifications';
import { PROFILE_QUERY_KEY } from '../../api/profile';
import { REQUESTS_QUERY_KEY } from '../../api/requests';
import {
	notificationLink,
	useLatestNotifications,
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
	useNotificationText,
	useUnreadCount,
} from '../../hooks/useNotifications';
import type { AppNotification } from '../../types/api';
import { fromNow } from '../../utils/date';

export function NotificationBell() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [opened, setOpened] = useState(false);

	const unread = useUnreadCount();
	const list = useLatestNotifications(opened);
	const markRead = useMarkNotificationRead();
	const markAll = useMarkAllNotificationsRead();
	const notificationText = useNotificationText();

	const count = unread.data?.count ?? 0;
	const latest = unread.data?.latest_created_at ?? null;

	// undefined — первый ответ ещё не пришёл: на старой истории тост не показываем
	const prevLatest = useRef<string | null | undefined>(undefined);

	useEffect(() => {
		if (!unread.isSuccess) return;
		if (prevLatest.current === undefined) {
			prevLatest.current = latest;
			return;
		}
		if (!latest || latest === prevLatest.current) return;
		prevLatest.current = latest;

		// Кто-то изменил наши заявки — обновляем открытые экраны
		void queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
		void queryClient.invalidateQueries({ queryKey: ['dashboard'] });

		void queryClient
			.fetchQuery({
				queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
				queryFn: fetchLatestNotifications,
				staleTime: 0,
			})
			.then(items => {
				const newest = items[0];
				if (newest && !newest.read_at) {
					toasts.show({
						title: t('notifications.newToast'),
						message: notificationText(newest),
					});
				}
			})
			.catch(() => undefined);
	}, [latest, unread.isSuccess, queryClient, t, notificationText]);

	const openNotification = (n: AppNotification) => {
		if (!n.read_at) markRead.mutate(n.id);
		setOpened(false);
		const link = notificationLink(n);
		if (link) navigate(link);
	};

	return (
		<Popover
			opened={opened}
			onChange={setOpened}
			position='bottom-end'
			width={360}
			shadow='md'
			radius='md'
		>
			<Popover.Target>
				<Indicator
					label={count > 9 ? '9+' : count}
					size={16}
					offset={4}
					disabled={count === 0}
				>
					<ActionIcon
						variant='subtle'
						color='gray'
						size='lg'
						aria-label={t('header.notifications')}
						onClick={() => setOpened(o => !o)}
					>
						<IconBell size={20} />
					</ActionIcon>
				</Indicator>
			</Popover.Target>

			<Popover.Dropdown p={0} maw='calc(100vw - 24px)'>
				<Group justify='space-between' px='md' py='sm'>
					<Text fw={600}>{t('notifications.title')}</Text>
					<Button
						variant='subtle'
						size='compact-xs'
						disabled={count === 0}
						loading={markAll.isPending}
						onClick={() => markAll.mutate()}
					>
						{t('notifications.markAllRead')}
					</Button>
				</Group>

				<ScrollArea.Autosize mah={400}>
					{list.isPending ? (
						<Center py='lg'>
							<Loader size='sm' />
						</Center>
					) : !list.data || list.data.length === 0 ? (
						<Text size='sm' c='dimmed' ta='center' py='lg'>
							{t('notifications.empty')}
						</Text>
					) : (
						<Stack gap={0}>
							{list.data.map(n => (
								<UnstyledButton
									key={n.id}
									onClick={() => openNotification(n)}
									px='md'
									py='sm'
									bg={n.read_at ? undefined : 'brand.0'}
									style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}
								>
									<Group gap='sm' wrap='nowrap' align='flex-start'>
										<Box
											w={8}
											h={8}
											mt={6}
											style={{
												borderRadius: '50%',
												flexShrink: 0,
												background: n.read_at
													? 'transparent'
													: 'var(--mantine-color-brand-6)',
											}}
										/>
										<div>
											<Text size='sm' fw={n.read_at ? 400 : 500}>
												{notificationText(n)}
											</Text>
											<Text size='xs' c='dimmed'>
												{fromNow(n.created_at)}
											</Text>
										</div>
									</Group>
								</UnstyledButton>
							))}
						</Stack>
					)}
				</ScrollArea.Autosize>
			</Popover.Dropdown>
		</Popover>
	);
}
