import {
	Avatar,
	Badge,
	Card,
	Group,
	Progress,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Tabs,
	Text,
	Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/EmptyState';
import { QueryError } from '../../components/QueryError';
import { RequestsListSection } from '../../components/requests/RequestsListSection';
import { VACATION_STATUSES } from '../../components/requests/requestOptions';
import { useListParams } from '../../hooks/useListParams';
import { useTeamRequests } from '../../hooks/useRequests';
import { useTeamEmployees } from '../../hooks/useTeam';
import type { RequestStatus, TeamEmployee } from '../../types/api';
import { getInitials } from '../../utils/user';

const PER_PAGE = 10;

function EmployeeCard({ employee }: { employee: TeamEmployee }) {
	const { t } = useTranslation();
	const { courses } = employee;

	return (
		<Card withBorder radius='md' padding='md'>
			<Group wrap='nowrap' align='flex-start' justify='space-between'>
				<Group wrap='nowrap'>
					<Avatar color='brand' radius='xl'>
						{getInitials(employee.full_name)}
					</Avatar>
					<div>
						<Text fw={500}>{employee.full_name}</Text>
						<Text size='sm' c='dimmed'>
							{employee.position}
						</Text>
					</div>
				</Group>
				{employee.on_vacation_now && (
					<Badge color='teal' variant='light' tt='none'>
						{t('team.onVacation')}
					</Badge>
				)}
			</Group>

			<Stack gap={4} mt='md'>
				<Group justify='space-between'>
					<Text size='sm' c='dimmed'>
						{t('team.available')}
					</Text>
					<Text size='sm' fw={500}>
						{t('profile.days', {
							count: Number(employee.vacation.available_days),
						})}
					</Text>
				</Group>
				<Group justify='space-between'>
					<Text size='sm' c='dimmed'>
						{t('team.courses')}
					</Text>
					<Text size='sm' fw={500}>
						{courses.assigned > 0
							? t('team.coursesProgress', {
									completed: courses.completed,
									assigned: courses.assigned,
								})
							: t('team.noCourses')}
					</Text>
				</Group>
				{courses.assigned > 0 && (
					<Progress value={courses.average_progress} size='sm' mt={4} />
				)}
			</Stack>
		</Card>
	);
}

export function TeamPage() {
	const { t } = useTranslation();
	const params = useListParams();
	const tab = params.get('tab') ?? 'pending';
	const status = params.get('status') as RequestStatus | undefined;

	// Запрос «ждут согласования» нужен всегда — для счётчика на вкладке
	const pending = useTeamRequests({
		status: 'pending_manager',
		page: tab === 'pending' ? params.page : 1,
		per_page: PER_PAGE,
	});
	const all = useTeamRequests(
		{ status, page: params.page, per_page: PER_PAGE },
		tab === 'all',
	);
	const employees = useTeamEmployees(tab === 'employees');

	const pendingTotal = pending.data?.meta.total ?? 0;
	const setPage = (page: number) => params.update({ page: String(page) });

	return (
		<Stack gap='lg'>
			<div>
				<Title order={2}>{t('team.title')}</Title>
				<Text c='dimmed'>{t('team.subtitle')}</Text>
			</div>

			<Tabs
				value={tab}
				onChange={value => params.update({ tab: value, status: null })}
			>
				<Tabs.List>
					<Tabs.Tab
						value='pending'
						rightSection={
							pendingTotal > 0 ? (
								<Badge size='sm' circle>
									{pendingTotal}
								</Badge>
							) : null
						}
					>
						{t('team.tabs.pending')}
					</Tabs.Tab>
					<Tabs.Tab value='all'>{t('team.tabs.all')}</Tabs.Tab>
					<Tabs.Tab value='employees'>{t('team.tabs.employees')}</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel value='pending' pt='md'>
					<RequestsListSection
						query={pending}
						page={params.page}
						onPageChange={setPage}
						showAuthor
						emptyTitle={t('team.pendingEmpty')}
						emptyText={t('team.pendingEmptyText')}
					/>
				</Tabs.Panel>

				<Tabs.Panel value='all' pt='md'>
					<Stack gap='md'>
						<Select
							aria-label={t('requestList.status')}
							placeholder={t('requestList.allStatuses')}
							data={VACATION_STATUSES.map(s => ({
								value: s,
								label: t(`requestStatus.${s}`),
							}))}
							value={status ?? null}
							onChange={value => params.update({ status: value })}
							clearable
							w={{ base: '100%', sm: 280 }}
						/>
						<RequestsListSection
							query={all}
							page={params.page}
							onPageChange={setPage}
							showAuthor
							emptyTitle={
								status ? t('requestList.notFound') : t('team.allEmpty')
							}
						/>
					</Stack>
				</Tabs.Panel>

				<Tabs.Panel value='employees' pt='md'>
					{employees.isPending ? (
						<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} height={150} radius='md' />
							))}
						</SimpleGrid>
					) : employees.isError ? (
						<QueryError
							error={employees.error}
							onRetry={() => employees.refetch()}
						/>
					) : employees.data.length === 0 ? (
						<EmptyState title={t('team.employeesEmpty')} />
					) : (
						<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
							{employees.data.map(employee => (
								<EmployeeCard key={employee.user_id} employee={employee} />
							))}
						</SimpleGrid>
					)}
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}
