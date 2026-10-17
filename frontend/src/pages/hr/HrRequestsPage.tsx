import { Badge, Group, Select, Stack, Tabs, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { RequestsListSection } from '../../components/requests/RequestsListSection';
import {
	REQUEST_STATUSES,
	REQUEST_TYPES,
} from '../../components/requests/requestOptions';
import { useDepartments } from '../../hooks/useHr';
import { useListParams } from '../../hooks/useListParams';
import { useHrRequests } from '../../hooks/useRequests';
import type { RequestStatus, RequestType } from '../../types/api';

const PER_PAGE = 10;

export function HrRequestsPage() {
	const { t } = useTranslation();
	const params = useListParams();
	const tab = params.get('tab') ?? 'queue';
	const status = params.get('status') as RequestStatus | undefined;
	const type = params.get('type') as RequestType | undefined;
	const department = params.get('department');
	const hasFilters = Boolean(status || type || department);

	// Очередь грузим всегда — для счётчика на вкладке
	const queue = useHrRequests({
		queue: true,
		page: tab === 'queue' ? params.page : 1,
		per_page: PER_PAGE,
	});
	const all = useHrRequests(
		{
			status,
			type,
			department_id: department ? Number(department) : undefined,
			page: params.page,
			per_page: PER_PAGE,
		},
		tab === 'all',
	);
	const departments = useDepartments(tab === 'all');

	const queueTotal = queue.data?.meta.total ?? 0;
	const setPage = (page: number) => params.update({ page: String(page) });

	return (
		<Stack gap='lg'>
			<div>
				<Title order={2}>{t('hrQueue.title')}</Title>
				<Text c='dimmed'>{t('hrQueue.subtitle')}</Text>
			</div>

			<Tabs
				value={tab}
				onChange={value =>
					params.update({
						tab: value,
						status: null,
						type: null,
						department: null,
					})
				}
			>
				<Tabs.List>
					<Tabs.Tab
						value='queue'
						rightSection={
							queueTotal > 0 ? (
								<Badge size='sm' circle>
									{queueTotal}
								</Badge>
							) : null
						}
					>
						{t('hrQueue.tabs.queue')}
					</Tabs.Tab>
					<Tabs.Tab value='all'>{t('hrQueue.tabs.all')}</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='queue' pt='md'>
					<RequestsListSection
						query={queue}
						page={params.page}
						onPageChange={setPage}
						showAuthor
						emptyTitle={t('hrQueue.queueEmpty')}
						emptyText={t('hrQueue.queueEmptyText')}
					/>
				</Tabs.Panel>

				<Tabs.Panel value='all' pt='md'>
					<Stack gap='md'>
						<Group gap='sm'>
							<Select
								aria-label={t('requestList.status')}
								placeholder={t('requestList.allStatuses')}
								data={REQUEST_STATUSES.map(s => ({
									value: s,
									label: t(`requestStatus.${s}`),
								}))}
								value={status ?? null}
								onChange={value => params.update({ status: value })}
								clearable
								w={{ base: '100%', sm: 260 }}
							/>
							<Select
								aria-label={t('requestList.type')}
								placeholder={t('requestList.allTypes')}
								data={REQUEST_TYPES.map(ty => ({
									value: ty,
									label: t(`requestType.${ty}`),
								}))}
								value={type ?? null}
								onChange={value => params.update({ type: value })}
								clearable
								w={{ base: '100%', sm: 200 }}
							/>
							<Select
								aria-label={t('hrQueue.department')}
								placeholder={t('hrQueue.allDepartments')}
								data={(departments.data ?? []).map(d => ({
									value: String(d.id),
									label: d.name,
								}))}
								value={department ?? null}
								onChange={value => params.update({ department: value })}
								clearable
								searchable
								w={{ base: '100%', sm: 240 }}
							/>
						</Group>
						<RequestsListSection
							query={all}
							page={params.page}
							onPageChange={setPage}
							showAuthor
							emptyTitle={
								hasFilters ? t('requestList.notFound') : t('hrQueue.allEmpty')
							}
							emptyText={hasFilters ? t('requestList.notFoundText') : undefined}
						/>
					</Stack>
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
