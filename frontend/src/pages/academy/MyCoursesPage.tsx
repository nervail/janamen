import {
	Button,
	Card,
	Group,
	Progress,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CourseStatusBadge } from '../../components/academy/CourseStatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { QueryError } from '../../components/QueryError';
import { useMyCourses } from '../../hooks/useAcademy';
import type { CourseAssignment } from '../../types/api';
import { formatDate } from '../../utils/date';

function CourseCard({ item }: { item: CourseAssignment }) {
	const { t } = useTranslation();
	const { course, assignment } = item;
	const completed = assignment.status === 'completed';
	const overdue =
		!completed &&
		assignment.due_date !== null &&
		dayjs(assignment.due_date).isBefore(dayjs(), 'day');

	const cta =
		assignment.status === 'not_started'
			? t('academy.start')
			: completed
				? t('academy.review')
				: t('academy.continue');

	return (
		<Card withBorder radius='md' padding='lg'>
			<Stack gap='sm' h='100%'>
				<Group justify='space-between' align='flex-start' wrap='nowrap'>
					<Title order={4}>{course.title}</Title>
					<CourseStatusBadge status={assignment.status} size='sm' />
				</Group>
				{course.description && (
					<Text size='sm' c='dimmed'>
						{course.description}
					</Text>
				)}
				<Text size='xs' c='dimmed'>
					{t('academy.chapters', { count: course.chapters_count })}
				</Text>

				<div>
					<Group justify='space-between' mb={4}>
						<Text size='xs' c='dimmed'>
							{t('academy.progress')}
						</Text>
						<Text size='xs' fw={500}>
							{assignment.progress_percent}%
						</Text>
					</Group>
					<Progress
						value={assignment.progress_percent}
						color={completed ? 'green' : 'brand'}
					/>
				</div>

				{assignment.due_date && !completed && (
					<Text size='xs' c={overdue ? 'red' : 'dimmed'}>
						{overdue
							? t('academy.overdue', { date: formatDate(assignment.due_date) })
							: t('academy.dueDate', { date: formatDate(assignment.due_date) })}
					</Text>
				)}

				<Button
					component={Link}
					to={`/courses/${course.id}`}
					mt='auto'
					variant={completed ? 'light' : 'filled'}
				>
					{cta}
				</Button>
			</Stack>
		</Card>
	);
}

export function MyCoursesPage() {
	const { t } = useTranslation();
	const query = useMyCourses();

	let content;
	if (query.isPending) {
		content = (
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
				<Skeleton height={260} radius='md' />
				<Skeleton height={260} radius='md' />
			</SimpleGrid>
		);
	} else if (query.isError) {
		content = (
			<QueryError error={query.error} onRetry={() => query.refetch()} />
		);
	} else if (query.data.length === 0) {
		content = (
			<EmptyState title={t('academy.empty')} text={t('academy.emptyText')} />
		);
	} else {
		content = (
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
				{query.data.map(item => (
					<CourseCard key={item.assignment.id} item={item} />
				))}
			</SimpleGrid>
		);
	}

	return (
		<Stack gap='lg'>
			<div>
				<Title order={2}>{t('academy.title')}</Title>
				<Text c='dimmed'>{t('academy.subtitle')}</Text>
			</div>
			{content}
		</Stack>
	);
}
