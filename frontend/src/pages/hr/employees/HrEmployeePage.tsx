import {
	Alert,
	Anchor,
	Avatar,
	Badge,
	Button,
	Divider,
	Grid,
	Group,
	Paper,
	Progress,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowLeft, IconDatabase, IconUserPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ApiError } from '../../../api/client';
import { CourseStatusBadge } from '../../../components/academy/CourseStatusBadge';
import { EmptyState } from '../../../components/EmptyState';
import { InfoItem } from '../../../components/InfoItem';
import { QueryError } from '../../../components/QueryError';
import { RequestsTable } from '../../../components/requests/RequestsTable';
import { useHrEmployee } from '../../../hooks/useHr';
import { formatDate, formatDateTime } from '../../../utils/date';
import { getInitials } from '../../../utils/user';
import { AssignCourseModal } from '../academy/AssignCourseModal';

export function HrEmployeePage() {
	const { t } = useTranslation();
	const { userId } = useParams();
	const id = Number(userId);
	const employee = useHrEmployee(id);
	const [assignOpened, assign] = useDisclosure(false);

	const back = (
		<Anchor component={Link} to='/hr/employees' size='sm'>
			<Group gap={4}>
				<IconArrowLeft size={14} />
				{t('hrEmployees.back')}
			</Group>
		</Anchor>
	);

	if (employee.isPending) {
		return (
			<Stack gap='lg'>
				{back}
				<Skeleton height={140} radius='md' />
				<Skeleton height={220} radius='md' />
				<Skeleton height={200} radius='md' />
			</Stack>
		);
	}

	if (employee.isError) {
		const notFound =
			employee.error instanceof ApiError && employee.error.status === 404;
		return (
			<Stack gap='lg'>
				{back}
				{notFound ? (
					<EmptyState
						title={t('hrEmployees.missingTitle')}
						text={t('hrEmployees.missingText')}
					/>
				) : (
					<QueryError
						error={employee.error}
						onRetry={() => employee.refetch()}
					/>
				)}
			</Stack>
		);
	}

	const e = employee.data;
	const days = (value: number | string) =>
		t('profile.days', { count: Number(value) });

	return (
		<Stack gap='lg'>
			{back}

			<Paper withBorder radius='md' p='lg'>
				<Group justify='space-between' align='flex-start' gap='md'>
					<Group wrap='nowrap'>
						<Avatar color='brand' radius='xl' size={64}>
							{getInitials(e.full_name)}
						</Avatar>
						<Stack gap={2}>
							<Title order={2}>{e.full_name}</Title>
							<Text c='dimmed'>
								{e.position} · {e.department.name}
							</Text>
						</Stack>
					</Group>
					<Button
						leftSection={<IconUserPlus size={16} />}
						onClick={assign.open}
					>
						{t('hrEmployees.assignCourse')}
					</Button>
				</Group>

				<Alert
					mt='md'
					variant='light'
					color='gray'
					icon={<IconDatabase size={18} />}
					title={`${t('profile.source')} · ${t('profile.syncedAt', {
						date: formatDateTime(e.source.synced_at),
					})}`}
				/>
			</Paper>

			<Grid gap='lg'>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Paper withBorder radius='md' p='lg' h='100%'>
						<Title order={4} mb='md'>
							{t('profile.personalData')}
						</Title>
						<SimpleGrid
							cols={{ base: 1, sm: 2 }}
							spacing='md'
							verticalSpacing='md'
						>
							<InfoItem label={t('profile.company')} value={e.company} />
							<InfoItem
								label={t('profile.department')}
								value={e.department.name}
							/>
							<InfoItem
								label={t('profile.manager')}
								value={
									e.manager
										? `${e.manager.full_name}, ${e.manager.position}`
										: t('profile.noManager')
								}
							/>
							<InfoItem
								label={t('profile.hiredAt')}
								value={formatDate(e.hired_at)}
							/>
						</SimpleGrid>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 4 }}>
					<Paper withBorder radius='md' p='lg' h='100%'>
						<Title order={4} mb='md'>
							{t('profile.vacation')}
						</Title>
						<Text fz={32} fw={700} c='brand.7' lh={1.2}>
							{days(e.vacation.available_days)}
						</Text>
						<Text size='sm' c='dimmed'>
							{t('profile.available')}
						</Text>
						<Divider my='md' />
						<Stack gap='xs'>
							<Group justify='space-between' wrap='nowrap'>
								<Text size='sm' c='dimmed'>
									{t('profile.balance')}
								</Text>
								<Text size='sm' fw={500}>
									{days(e.vacation.balance_days)}
								</Text>
							</Group>
							<Group justify='space-between' wrap='nowrap'>
								<Text size='sm' c='dimmed'>
									{t('profile.reserved')}
								</Text>
								<Text size='sm' fw={500}>
									{days(e.vacation.reserved_days)}
								</Text>
							</Group>
						</Stack>
					</Paper>
				</Grid.Col>
			</Grid>

			<Stack gap='sm'>
				<Group gap='xs' align='baseline'>
					<Title order={4}>{t('hrEmployees.requests')}</Title>
					{e.requests.length > 0 && (
						<Text size='sm' c='dimmed'>
							{t('hrEmployees.requestsHint')}
						</Text>
					)}
				</Group>
				{e.requests.length === 0 ? (
					<EmptyState title={t('hrEmployees.noRequests')} />
				) : (
					<RequestsTable requests={e.requests} />
				)}
			</Stack>

			<Stack gap='sm'>
				<Title order={4}>{t('hrEmployees.courses')}</Title>
				{e.courses.length === 0 ? (
					<EmptyState
						title={t('hrEmployees.noCourses')}
						action={
							<Button
								mt='xs'
								variant='light'
								leftSection={<IconUserPlus size={16} />}
								onClick={assign.open}
							>
								{t('hrEmployees.assignCourse')}
							</Button>
						}
					/>
				) : (
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						{e.courses.map(({ course, assignment }) => (
							<Paper key={assignment.id} withBorder radius='md' p='md'>
								<Group
									justify='space-between'
									align='flex-start'
									wrap='nowrap'
									mb='xs'
								>
									<Text fw={600}>{course.title}</Text>
									<CourseStatusBadge status={assignment.status} size='sm' />
								</Group>
								<Group gap='xs' wrap='nowrap'>
									<Progress
										value={assignment.progress_percent}
										color={
											assignment.status === 'completed' ? 'green' : 'brand'
										}
										size='sm'
										style={{ flex: 1 }}
									/>
									<Text size='xs' fw={500}>
										{assignment.progress_percent}%
									</Text>
								</Group>
								<Group mt='xs' gap='xs'>
									{assignment.completed_at ? (
										<Badge variant='light' color='green' size='sm' tt='none'>
											{t('hrAcademy.completedOn', {
												date: formatDate(assignment.completed_at),
											})}
										</Badge>
									) : (
										<Text size='xs' c='dimmed'>
											{assignment.due_date
												? t('hrEmployees.dueDate', {
														date: formatDate(assignment.due_date),
													})
												: t('hrEmployees.noDueDate')}
										</Text>
									)}
								</Group>
							</Paper>
						))}
					</SimpleGrid>
				)}
			</Stack>

			<AssignCourseModal
				opened={assignOpened}
				onClose={assign.close}
				initialCourseId={null}
				initialUserId={id}
			/>
		</Stack>
	);
}
