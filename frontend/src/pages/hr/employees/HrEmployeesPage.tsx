import { useState } from 'react';
import {
	Anchor,
	Avatar,
	Card,
	Group,
	Pagination,
	Paper,
	Select,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { EmptyState } from '../../../components/EmptyState';
import { QueryError } from '../../../components/QueryError';
import { RoleBadge } from '../../../components/RoleBadge';
import { useDepartments, useHrEmployees } from '../../../hooks/useHr';
import { useListParams } from '../../../hooks/useListParams';
import type { HrEmployee } from '../../../types/api';
import { getInitials } from '../../../utils/user';

const PER_PAGE = 20;

function VacationCell({ employee }: { employee: HrEmployee }) {
	const { t } = useTranslation();
	return (
		<Text size='sm'>
			{t('hrEmployees.vacationShort', {
				available: Number(employee.vacation.available_days),
				balance: Number(employee.vacation.balance_days),
			})}
		</Text>
	);
}

export function HrEmployeesPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const params = useListParams();
	const urlSearch = params.get('search') ?? '';
	const department = params.get('department');

	// Поле ввода отвечает сразу, а в URL (и в запрос) текст попадает с задержкой
	const [search, setSearch] = useState(urlSearch);
	const updateSearch = useDebouncedCallback(
		(value: string) => params.update({ search: value.trim() || null }),
		300,
	);

	const employees = useHrEmployees({
		search: urlSearch || undefined,
		department_id: department ? Number(department) : undefined,
		page: params.page,
		per_page: PER_PAGE,
	});
	const departments = useDepartments();
	const hasFilters = Boolean(urlSearch || department);

	let content;
	if (employees.isPending) {
		content = (
			<Stack gap='xs'>
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} height={56} radius='md' />
				))}
			</Stack>
		);
	} else if (employees.isError) {
		content = (
			<QueryError error={employees.error} onRetry={() => employees.refetch()} />
		);
	} else if (employees.data.data.length === 0) {
		content = hasFilters ? (
			<EmptyState
				title={t('requestList.notFound')}
				text={t('requestList.notFoundText')}
			/>
		) : (
			<EmptyState
				title={t('hrEmployees.empty')}
				text={t('hrEmployees.emptyText')}
			/>
		);
	} else {
		const { data: rows, meta } = employees.data;
		content = (
			<Stack
				gap='md'
				style={{
					opacity: employees.isFetching ? 0.6 : 1,
					transition: 'opacity 150ms',
				}}
			>
				<Paper withBorder radius='md' visibleFrom='sm'>
					<Table verticalSpacing='sm' highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>{t('hrEmployees.employee')}</Table.Th>
								<Table.Th>{t('hrEmployees.department')}</Table.Th>
								<Table.Th>{t('hrEmployees.role')}</Table.Th>
								<Table.Th>{t('hrEmployees.vacation')}</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{rows.map(e => (
								<Table.Tr
									key={e.user_id}
									style={{ cursor: 'pointer' }}
									onClick={() => navigate(`/hr/employees/${e.user_id}`)}
								>
									<Table.Td>
										<Group gap='sm' wrap='nowrap'>
											<Avatar color='brand' radius='xl' size={36}>
												{getInitials(e.full_name)}
											</Avatar>
											<div>
												{/* Ссылка — для клавиатуры и «открыть в новой вкладке» */}
												<Anchor
													component={Link}
													to={`/hr/employees/${e.user_id}`}
													size='sm'
													fw={500}
													c='inherit'
													onClick={ev => ev.stopPropagation()}
												>
													{e.full_name}
												</Anchor>
												<Text size='xs' c='dimmed'>
													{e.position}
												</Text>
											</div>
										</Group>
									</Table.Td>
									<Table.Td>
										<Text size='sm'>{e.department.name}</Text>
									</Table.Td>
									<Table.Td>
										<RoleBadge role={e.role} />
									</Table.Td>
									<Table.Td>
										<VacationCell employee={e} />
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Paper>

				<Stack hiddenFrom='sm' gap='sm'>
					{rows.map(e => (
						<Card
							key={e.user_id}
							component={Link}
							to={`/hr/employees/${e.user_id}`}
							withBorder
							radius='md'
							padding='md'
						>
							<Group justify='space-between' align='flex-start' wrap='nowrap'>
								<Group gap='sm' wrap='nowrap'>
									<Avatar color='brand' radius='xl' size={36}>
										{getInitials(e.full_name)}
									</Avatar>
									<div>
										<Text size='sm' fw={600}>
											{e.full_name}
										</Text>
										<Text size='xs' c='dimmed'>
											{e.position} · {e.department.name}
										</Text>
									</div>
								</Group>
								<RoleBadge role={e.role} />
							</Group>
							<Group justify='space-between' mt='xs'>
								<Text size='xs' c='dimmed'>
									{t('hrEmployees.vacation')}
								</Text>
								<VacationCell employee={e} />
							</Group>
						</Card>
					))}
				</Stack>

				{meta.last_page > 1 && (
					<Group justify='center'>
						<Pagination
							total={meta.last_page}
							value={params.page}
							onChange={page => params.update({ page: String(page) })}
						/>
					</Group>
				)}
			</Stack>
		);
	}

	return (
		<Stack gap='lg'>
			<div>
				<Group gap='sm' align='baseline'>
					<Title order={2}>{t('hrEmployees.title')}</Title>
					{employees.data && (
						<Text c='dimmed'>
							{t('hrEmployees.total', { count: employees.data.meta.total })}
						</Text>
					)}
				</Group>
				<Text c='dimmed'>{t('hrEmployees.subtitle')}</Text>
			</div>

			<Group gap='sm'>
				<TextInput
					leftSection={<IconSearch size={16} />}
					placeholder={t('hrEmployees.search')}
					aria-label={t('hrEmployees.search')}
					value={search}
					onChange={e => {
						setSearch(e.currentTarget.value);
						updateSearch(e.currentTarget.value);
					}}
					w={{ base: '100%', sm: 300 }}
				/>
				<Select
					aria-label={t('hrEmployees.department')}
					placeholder={t('hrEmployees.allDepartments')}
					data={(departments.data ?? []).map(d => ({
						value: String(d.id),
						label: d.name,
					}))}
					value={department ?? null}
					onChange={value => params.update({ department: value })}
					clearable
					searchable
					w={{ base: '100%', sm: 260 }}
				/>
			</Group>

			{content}
		</Stack>
	);
}
