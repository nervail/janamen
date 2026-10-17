import {
	Button,
	Group,
	Pagination,
	Paper,
	Select,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconInbox, IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { QueryError } from '../../components/QueryError';
import { RequestsTable } from '../../components/requests/RequestsTable';
import { useMyRequests } from '../../hooks/useRequests';
import type { RequestStatus, RequestType } from '../../types/api';

const STATUS_OPTIONS: RequestStatus[] = [
	'pending_manager',
	'pending_hr',
	'awaiting_signature',
	'approved',
	'rejected',
	'cancelled',
	'open',
	'answered',
];

// Аванс добавим в фильтр, если успеем его сделать
const TYPE_OPTIONS: RequestType[] = ['vacation', 'hr_question'];

const PER_PAGE = 10;

export function RequestsPage() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();

	const status =
		(searchParams.get('status') as RequestStatus | null) ?? undefined;
	const type = (searchParams.get('type') as RequestType | null) ?? undefined;
	const page = Number(searchParams.get('page')) || 1;
	const hasFilters = Boolean(status || type);

	const query = useMyRequests({ status, type, page, per_page: PER_PAGE });

	// Фильтры живут в адресе: F5 и кнопка «Назад» их не сбрасывают
	const updateParams = (changes: Record<string, string | null>) => {
		const next = new URLSearchParams(searchParams);
		for (const [key, value] of Object.entries(changes)) {
			if (value) next.set(key, value);
			else next.delete(key);
		}
		// При смене фильтра возвращаемся на первую страницу
		if (!('page' in changes)) next.delete('page');
		setSearchParams(next, { replace: true });
	};

	let content;
	if (query.isPending) {
		content = (
			<Stack gap='xs'>
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} height={52} radius='md' />
				))}
			</Stack>
		);
	} else if (query.isError) {
		content = (
			<QueryError error={query.error} onRetry={() => query.refetch()} />
		);
	} else if (query.data.data.length === 0) {
		content = (
			<Paper withBorder radius='md' p='xl'>
				<Stack align='center' gap='xs'>
					<ThemeIcon size={48} radius='xl' variant='light'>
						<IconInbox size={26} />
					</ThemeIcon>
					<Text fw={600}>
						{hasFilters ? t('requestList.notFound') : t('requestList.empty')}
					</Text>
					<Text size='sm' c='dimmed' ta='center'>
						{hasFilters
							? t('requestList.notFoundText')
							: t('requestList.emptyText')}
					</Text>
					{hasFilters ? (
						<Button
							variant='light'
							mt='xs'
							onClick={() => setSearchParams({}, { replace: true })}
						>
							{t('requestList.resetFilters')}
						</Button>
					) : (
						<Button
							component={Link}
							to='/requests/new'
							mt='xs'
							leftSection={<IconPlus size={16} />}
						>
							{t('requestList.new')}
						</Button>
					)}
				</Stack>
			</Paper>
		);
	} else {
		const { data: requests, meta } = query.data;
		content = (
			<Stack
				gap='md'
				style={{
					opacity: query.isFetching ? 0.6 : 1,
					transition: 'opacity 150ms',
				}}
			>
				<RequestsTable requests={requests} />
				{meta.last_page > 1 && (
					<Group justify='center'>
						<Pagination
							total={meta.last_page}
							value={page}
							onChange={p => updateParams({ page: String(p) })}
						/>
					</Group>
				)}
			</Stack>
		);
	}

	return (
		<Stack gap='lg'>
			<Group justify='space-between' align='flex-end'>
				<div>
					<Title order={2}>{t('requestList.title')}</Title>
					<Text c='dimmed'>{t('requestList.subtitle')}</Text>
				</div>
				<Button
					component={Link}
					to='/requests/new'
					leftSection={<IconPlus size={16} />}
				>
					{t('requestList.new')}
				</Button>
			</Group>

			<Group gap='sm'>
				<Select
					aria-label={t('requestList.status')}
					placeholder={t('requestList.allStatuses')}
					data={STATUS_OPTIONS.map(s => ({
						value: s,
						label: t(`requestStatus.${s}`),
					}))}
					value={status ?? null}
					onChange={value => updateParams({ status: value })}
					clearable
					w={{ base: '100%', sm: 280 }}
				/>
				<Select
					aria-label={t('requestList.type')}
					placeholder={t('requestList.allTypes')}
					data={TYPE_OPTIONS.map(ty => ({
						value: ty,
						label: t(`requestType.${ty}`),
					}))}
					value={type ?? null}
					onChange={value => updateParams({ type: value })}
					clearable
					w={{ base: '100%', sm: 220 }}
				/>
			</Group>

			{content}
		</Stack>
	);
}
