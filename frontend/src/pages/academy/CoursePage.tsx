import {
	Alert,
	Button,
	Group,
	Paper,
	Progress,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconArrowLeft, IconCheck, IconTrophy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { CourseStatusBadge } from '../../components/academy/CourseStatusBadge';
import { QueryError } from '../../components/QueryError';
import { useCourse } from '../../hooks/useAcademy';
import type { CourseChapter } from '../../types/api';
import { formatDate } from '../../utils/date';
import type { TFunction } from 'i18next';

function testLabel(chapter: CourseChapter, t: TFunction) {
	if (chapter.passed)
		return t('academy.testPassed', {
			score: chapter.last_score,
			max: chapter.max_score,
		});
	if (chapter.attempts > 0) return t('academy.testFailed');
	return t('academy.testNotStarted');
}

export function CoursePage() {
	const { t } = useTranslation();
	const { courseId } = useParams();
	const id = Number(courseId);
	const query = useCourse(id);

	const backButton = (
		<Group>
			<Button
				component={Link}
				to='/courses'
				variant='subtle'
				color='gray'
				size='compact-sm'
				leftSection={<IconArrowLeft size={16} />}
			>
				{t('academy.backToCourses')}
			</Button>
		</Group>
	);

	if (query.isPending) return <Skeleton height={420} radius='md' />;
	if (query.isError) {
		return (
			<Stack gap='lg'>
				{backButton}
				<QueryError error={query.error} />
			</Stack>
		);
	}

	const course = query.data;
	const { assignment } = course;
	const completed = assignment.status === 'completed';
	const next = course.chapters.find(c => !c.completed);

	return (
		<Stack gap='lg'>
			{backButton}

			<Group justify='space-between' align='flex-start'>
				<div>
					<Title order={2}>{course.title}</Title>
					{course.description && <Text c='dimmed'>{course.description}</Text>}
				</div>
				<CourseStatusBadge status={assignment.status} size='lg' />
			</Group>

			<Paper withBorder radius='md' p='lg'>
				<Group justify='space-between' mb={6}>
					<Text fw={500}>{t('academy.progress')}</Text>
					<Text fz={24} fw={700} c={completed ? 'green' : 'brand.7'}>
						{assignment.progress_percent}%
					</Text>
				</Group>
				<Progress
					value={assignment.progress_percent}
					size='lg'
					color={completed ? 'green' : 'brand'}
				/>
				{assignment.due_date && !completed && (
					<Text size='sm' c='dimmed' mt='xs'>
						{t('academy.dueDate', { date: formatDate(assignment.due_date) })}
					</Text>
				)}
				{completed && (
					<Alert
						mt='md'
						color='green'
						variant='light'
						icon={<IconTrophy size={18} />}
						title={t('academy.courseCompleted')}
					>
						{t('academy.courseCompletedText')}
					</Alert>
				)}
			</Paper>

			<div>
				<Title order={4} mb='sm'>
					{t('academy.chapters')}
				</Title>
				<Stack gap='sm'>
					{course.chapters.map(chapter => {
						const isNext = chapter.id === next?.id;
						return (
							<Paper key={chapter.id} withBorder radius='md' p='md'>
								<Group justify='space-between' wrap='nowrap' gap='sm'>
									<Group wrap='nowrap' gap='md'>
										<ThemeIcon
											radius='xl'
											size='lg'
											color={
												chapter.completed ? 'green' : isNext ? 'brand' : 'gray'
											}
											variant={chapter.completed ? 'filled' : 'light'}
										>
											{chapter.completed ? (
												<IconCheck size={18} />
											) : (
												chapter.position
											)}
										</ThemeIcon>
										<div>
											<Text fw={500}>{chapter.title}</Text>
											<Text size='xs' c='dimmed'>
												{chapter.material_viewed
													? t('academy.materialViewed')
													: t('academy.materialNotViewed')}
												{' · '}
												{testLabel(chapter, t)}
											</Text>
										</div>
									</Group>
									<Button
										component={Link}
										to={`/courses/${course.id}/chapters/${chapter.id}`}
										size='xs'
										variant={isNext ? 'filled' : 'default'}
									>
										{chapter.completed
											? t('academy.review')
											: isNext
												? chapter.material_viewed || chapter.attempts > 0
													? t('academy.continue')
													: t('academy.start')
												: t('academy.open')}
									</Button>
								</Group>
							</Paper>
						);
					})}
				</Stack>
			</div>
		</Stack>
	);
}
