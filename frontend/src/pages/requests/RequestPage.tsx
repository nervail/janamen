import { useState } from 'react';
import {
	Avatar,
	Button,
	Divider,
	Grid,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { QueryError } from '../../components/QueryError';
import { RequestActionModal } from '../../components/requests/RequestActionModal';
import { RequestDetails } from '../../components/requests/RequestDetails';
import { RequestHistory } from '../../components/requests/RequestHistory';
import { RequestStatusBadge } from '../../components/requests/RequestStatusBadge';
import { ACTION_CONFIG } from '../../components/requests/requestActions';
import { useMe } from '../../hooks/useAuth';
import { useRequest } from '../../hooks/useRequests';
import type { ExecutableAction } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import { getInitials } from '../../utils/user';
import { ForbiddenPage } from '../ForbiddenPage';

function RequestSkeleton() {
	return (
		<Stack gap='lg'>
			<Skeleton height={60} radius='md' />
			<Grid gap='lg'>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Stack gap='lg'>
						<Skeleton height={180} radius='md' />
						<Skeleton height={220} radius='md' />
					</Stack>
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Skeleton height={200} radius='md' />
				</Grid.Col>
			</Grid>
		</Stack>
	);
}

export function RequestPage() {
	const { t } = useTranslation();
	const { id } = useParams();
	const requestId = Number(id);
	const navigate = useNavigate();
	const location = useLocation();
	const { data: me } = useMe();
	const query = useRequest(requestId);
	const [action, setAction] = useState<ExecutableAction | null>(null);

	// Если на карточку пришли по прямой ссылке, «Назад» ведёт в список заявок
	const goBack = () =>
		location.key !== 'default' ? navigate(-1) : navigate('/requests');

	const backButton = (
		<Group>
			<Button
				variant='subtle'
				color='gray'
				size='compact-sm'
				leftSection={<IconArrowLeft size={16} />}
				onClick={goBack}
			>
				{t('requestCard.back')}
			</Button>
		</Group>
	);

	if (!Number.isInteger(requestId) || requestId <= 0) {
		return <QueryError error={new ApiError(404, 'not_found', 'Not found')} />;
	}
	if (query.isPending) return <RequestSkeleton />;
	if (query.isError) {
		if (query.error instanceof ApiError && query.error.status === 403)
			return <ForbiddenPage />;
		const canRetry =
			!(query.error instanceof ApiError) ||
			query.error.status >= 500 ||
			query.error.status === 0;
		return (
			<Stack gap='lg'>
				{backButton}
				<QueryError
					error={query.error}
					onRetry={canRetry ? () => query.refetch() : undefined}
				/>
			</Stack>
		);
	}

	const request = query.data;
	const isAuthor = me?.id === request.author.id;
	const actions = request.available_actions.filter(
		(a): a is ExecutableAction => a !== 'create',
	);

	return (
		<Stack gap='lg'>
			{backButton}

			<Group justify='space-between' align='flex-start' gap='sm'>
				<div>
					<Title order={2}>
						{t(`requestCard.title.${request.type}`, { id: request.id })}
					</Title>
					<Text size='sm' c='dimmed'>
						{t('requestCard.createdAt', {
							date: formatDateTime(request.created_at),
						})}
					</Text>
				</div>
				<RequestStatusBadge status={request.status} size='lg' />
			</Group>

			<Grid gap='lg'>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Stack gap='lg'>
						<Paper withBorder radius='md' p='lg'>
							<Title order={4} mb='md'>
								{t('requestCard.details')}
							</Title>
							<RequestDetails request={request} />
						</Paper>
						<Paper withBorder radius='md' p='lg'>
							<Title order={4} mb='md'>
								{t('requestCard.history')}
							</Title>
							<RequestHistory history={request.history} />
						</Paper>
					</Stack>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 4 }}>
					<Stack gap='lg'>
						<Paper withBorder radius='md' p='lg'>
							<Title order={5} mb={4}>
								{t('requestCard.currentStep')}
							</Title>
							<Text fw={500}>
								{request.current_step
									? t(`requestCard.steps.${request.current_step}`)
									: t('requestCard.finished')}
							</Text>
							{request.current_step && (
								<Text size='sm' c='dimmed'>
									{t('requestCard.approver')}:{' '}
									{request.current_approver?.full_name ??
										t('requestCard.anyHr')}
								</Text>
							)}

							<Divider my='md' />

							{actions.length > 0 ? (
								<Stack gap='xs'>
									{actions.map(a => {
										const config = ACTION_CONFIG[a];
										return (
											<Button
												key={a}
												fullWidth
												color={config.color}
												variant={config.variant}
												leftSection={<config.icon size={16} />}
												onClick={() => setAction(a)}
											>
												{t(`requestCard.actions.${a}`)}
											</Button>
										);
									})}
								</Stack>
							) : (
								<Text size='sm' c='dimmed'>
									{t('requestCard.noActions')}
								</Text>
							)}
						</Paper>

						{!isAuthor && (
							<Paper withBorder radius='md' p='lg'>
								<Title order={5} mb='sm'>
									{t('requestCard.author')}
								</Title>
								<Group wrap='nowrap'>
									<Avatar color='brand' radius='xl'>
										{getInitials(request.author.full_name)}
									</Avatar>
									<div>
										<Text fw={500}>{request.author.full_name}</Text>
										<Text size='sm' c='dimmed'>
											{request.author.position}
										</Text>
									</div>
								</Group>
							</Paper>
						)}
					</Stack>
				</Grid.Col>
			</Grid>

			<RequestActionModal
				key={action ?? 'closed'}
				requestId={request.id}
				action={action}
				onClose={() => setAction(null)}
			/>
		</Stack>
	);
}
