import type { ReactNode } from 'react';
import {
	Anchor,
	Button,
	Grid,
	Group,
	Paper,
	Progress,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
	UnstyledButton,
} from '@mantine/core';
import {
	IconCalendarPlus,
	IconMessageReport,
	IconInbox,
	IconMessageChatbot,
	IconSchool,
	IconUsers,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { QueryError } from '../../components/QueryError';
import { RequestStatusBadge } from '../../components/requests/RequestStatusBadge';
import { RequestSummary } from '../../components/requests/RequestSummary';
import { useDashboard } from '../../hooks/useDashboard';

import type { CourseAssignment } from '../../types/api';
import { formatDate } from '../../utils/date';

function Section({
	title,
	link,
	linkLabel,
	children,
}: {
	title: string;
	link?: string;
	linkLabel?: string;
	children: ReactNode;
}) {
	return (
		<Paper withBorder radius='md' p='lg'>
			<Group justify='space-between' mb='md'>
				<Title order={4}>{title}</Title>
				{link && (
					<Anchor component={Link} to={link} size='sm'>
						{linkLabel}
					</Anchor>
				)}
			</Group>
			{children}
		</Paper>
	);
}

function StatCard({
	icon,
	label,
	value,
	hint,
	action,
}: {
	icon: ReactNode;
	label: string;
	value: string;
	hint?: string;
	action: ReactNode;
}) {
	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='xs' h='100%' justify='space-between'>
				<div>
					<Group gap='xs' mb={6}>
						<ThemeIcon variant='light' radius='md'>
							{icon}
						</ThemeIcon>
						<Text size='sm' c='dimmed'>
							{label}
						</Text>
					</Group>
					<Text fz={28} fw={700} lh={1.2}>
						{value}
					</Text>
					{hint && (
						<Text size='xs' c='dimmed'>
							{hint}
						</Text>
					)}
				</div>
				{action}
			</Stack>
		</Paper>
	);
}

function ServiceButton({
	to,
	icon,
	label,
}: {
	to: string;
	icon: ReactNode;
	label: string;
}) {
	return (
		<UnstyledButton
			component={Link}
			to={to}
			p='md'
			style={{
				border: '1px solid var(--mantine-color-gray-3)',
				borderRadius: 'var(--mantine-radius-md)',
			}}
		>
			<Group gap='sm' wrap='nowrap'>
				<ThemeIcon variant='light' size='lg' radius='md'>
					{icon}
				</ThemeIcon>
				<Text size='sm' fw={500}>
					{label}
				</Text>
			</Group>
		</UnstyledButton>
	);
}

function CourseRow({ item }: { item: CourseAssignment }) {
	const { t } = useTranslation();
	const { course, assignment } = item;

	return (
		<UnstyledButton component={Link} to={`/courses/${course.id}`}>
			<Group justify='space-between' wrap='nowrap' mb={4}>
				<Text size='sm' fw={500} lineClamp={1}>
					{course.title}
				</Text>
				<Text size='xs' c='dimmed'>
					{assignment.progress_percent}%
				</Text>
			</Group>
			<Progress
				value={assignment.progress_percent}
				size='sm'
				color={assignment.status === 'completed' ? 'green' : 'brand'}
			/>
			<Text size='xs' c='dimmed' mt={4}>
				{t(`dashboard.courseStatus.${assignment.status}`)}
				{assignment.due_date && assignment.status !== 'completed'
					? ` · ${t('dashboard.dueDate', { date: formatDate(assignment.due_date) })}`
					: ''}
			</Text>
		</UnstyledButton>
	);
}

function DashboardSkeleton() {
	return (
		<Stack gap='lg'>
			<Skeleton height={48} width={320} radius='md' />
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
				<Skeleton height={150} radius='md' />
				<Skeleton height={150} radius='md' />
				<Skeleton height={150} radius='md' />
			</SimpleGrid>
			<Skeleton height={260} radius='md' />
		</Stack>
	);
}

export function DashboardPage() {
	const { t } = useTranslation();

	const { data, isPending, isError, error, refetch } = useDashboard();

	if (isPending) return <DashboardSkeleton />;
	if (isError) return <QueryError error={error} onRetry={() => refetch()} />;

	const firstName =
		data.profile.full_name.split(' ')[1] ?? data.profile.full_name;

	return (
		<Stack gap='lg'>
			<div>
				<Title order={2}>{t('dashboard.greeting', { name: firstName })}</Title>
				<Text c='dimmed'>
					{data.profile.position} · {data.profile.department}
				</Text>
			</div>

			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
				<StatCard
					icon={<IconCalendarPlus size={18} />}
					label={t('dashboard.vacationTitle')}
					value={t('profile.days', {
						count: Number(data.vacation.available_days),
					})}
					hint={`${t('dashboard.vacationAvailable')} · ${t(
						'dashboard.vacationBalance',
						{
							days: t('profile.days', {
								count: Number(data.vacation.balance_days),
							}),
						},
					)}`}
					action={
						<Button
							component={Link}
							to='/requests/new'
							size='xs'
							w='fit-content'
						>
							{t('dashboard.requestVacation')}
						</Button>
					}
				/>
				{data.team_pending_count !== null && (
					<StatCard
						icon={<IconUsers size={18} />}
						label={t('dashboard.teamPending')}
						value={String(data.team_pending_count)}
						action={
							<Button
								component={Link}
								to='/team'
								size='xs'
								variant='light'
								w='fit-content'
							>
								{t('dashboard.open')}
							</Button>
						}
					/>
				)}
				{data.hr_queue_count !== null && (
					<StatCard
						icon={<IconInbox size={18} />}
						label={t('dashboard.hrQueue')}
						value={String(data.hr_queue_count)}
						action={
							<Button
								component={Link}
								to='/hr/requests'
								size='xs'
								variant='light'
								w='fit-content'
							>
								{t('dashboard.open')}
							</Button>
						}
					/>
				)}
			</SimpleGrid>

			<div>
				<Text fw={600} mb='xs'>
					{t('dashboard.services')}
				</Text>
				<SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
					<ServiceButton
						to='/requests/new'
						icon={<IconCalendarPlus size={18} />}
						label={t('dashboard.serviceVacation')}
					/>
					<ServiceButton
						to='/assistant'
						icon={<IconMessageChatbot size={18} />}
						label={t('dashboard.serviceAssistant')}
					/>
					<ServiceButton
						to='/courses'
						icon={<IconSchool size={18} />}
						label={t('dashboard.serviceCourses')}
					/>
					<ServiceButton
						to='/profile'
						icon={<IconMessageReport size={18} />}
						label={t('dashboard.serviceReport')}
					/>
				</SimpleGrid>
			</div>

			<Grid gap='lg'>
				<Grid.Col span={{ base: 12, md: 7 }}>
					<Section
						title={t('dashboard.recentRequests')}
						link='/requests'
						linkLabel={t('dashboard.allRequests')}
					>
						{data.recent_requests.length === 0 ? (
							<Text size='sm' c='dimmed'>
								{t('dashboard.noRequests')}
							</Text>
						) : (
							<Stack gap={0}>
								{data.recent_requests.map((request, index) => (
									<UnstyledButton
										key={request.id}
										component={Link}
										to={`/requests/${request.id}`}
										py='sm'
										style={
											index > 0
												? { borderTop: '1px solid var(--mantine-color-gray-2)' }
												: undefined
										}
									>
										<Group
											justify='space-between'
											wrap='nowrap'
											align='flex-start'
											gap='sm'
										>
											<div>
												<Text size='xs' c='dimmed'>
													{t(`requestType.${request.type}`)} · #{request.id}
												</Text>
												<RequestSummary request={request} />
											</div>
											<RequestStatusBadge status={request.status} size='sm' />
										</Group>
									</UnstyledButton>
								))}
							</Stack>
						)}
					</Section>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 5 }}>
					<Stack gap='lg'>
						<Section
							title={t('dashboard.courses')}
							link='/courses'
							linkLabel={t('dashboard.allCourses')}
						>
							{data.courses.length === 0 ? (
								<Text size='sm' c='dimmed'>
									{t('dashboard.noCourses')}
								</Text>
							) : (
								<Stack gap='md'>
									{data.courses.map(item => (
										<CourseRow key={item.assignment.id} item={item} />
									))}
								</Stack>
							)}
						</Section>
					</Stack>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
