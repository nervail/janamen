import { useRef, useState } from 'react';
import {
	Button,
	Group,
	Pagination,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconFilterOff, IconUserPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../../components/EmptyState';
import { QueryError } from '../../../components/QueryError';
import {
	useDepartments,
	useHrAssignments,
	useHrCourses,
} from '../../../hooks/useHr';
import { useListParams } from '../../../hooks/useListParams';
import type { AssignmentStatus } from '../../../types/api';
import { AssignCourseModal } from './AssignCourseModal';
import { AssignmentsTable } from './AssignmentsTable';
import { CourseStatsCard } from './CourseStatsCard';

const PER_PAGE = 10;
const STATUSES: AssignmentStatus[] = ['not_started', 'in_progress', 'completed'];

export function HrCoursesPage() {
	const { t } = useTranslation();
	const params = useListParams();
	const course = params.get('course');
	const status = params.get('status') as AssignmentStatus | undefined;
	const department = params.get('department');
	const hasFilters = Boolean(course || status || department);

	// null — модалка закрыта; 0 — открыта без предвыбранного курса
	const [assignFor, setAssignFor] = useState<number | null>(null);
	const listRef = useRef<HTMLDivElement>(null);

	const courses = useHrCourses();
	const departments = useDepartments();
	const assignments = useHrAssignments({
		course_id: course ? Number(course) : undefined,
		status,
		department_id: department ? Number(department) : undefined,
		page: params.page,
		per_page: PER_PAGE,
	});

	const showCourseProgress = (id: number) => {
		const value = course === String(id) ? null : String(id);
		params.update({ course: value });
		if (value) {
			listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	let coursesContent;
	if (courses.isPending) {
		coursesContent = (
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
				<Skeleton height={250} radius='md' />
				<Skeleton height={250} radius='md' />
			</SimpleGrid>
		);
	} else if (courses.isError) {
		coursesContent = (
			<QueryError error={courses.error} onRetry={() => courses.refetch()} />
		);
	} else if (courses.data.length === 0) {
		coursesContent = (
			<EmptyState
				title={t('hrAcademy.coursesEmpty')}
				text={t('hrAcademy.coursesEmptyText')}
			/>
		);
	} else {
		coursesContent = (
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
				{courses.data.map(c => (
					<CourseStatsCard
						key={c.id}
						course={c}
						selected={course === String(c.id)}
						onShowProgress={() => showCourseProgress(c.id)}
						onAssign={() => setAssignFor(c.id)}
					/>
				))}
			</SimpleGrid>
		);
	}

	let listContent;
	if (assignments.isPending) {
		listContent = (
			<Stack gap='xs'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} height={56} radius='md' />
				))}
			</Stack>
		);
	} else if (assignments.isError) {
		listContent = (
			<QueryError
				error={assignments.error}
				onRetry={() => assignments.refetch()}
			/>
		);
	} else if (assignments.data.data.length === 0) {
		listContent = hasFilters ? (
			<EmptyState
				title={t('requestList.notFound')}
				text={t('requestList.notFoundText')}
			/>
		) : (
			<EmptyState
				title={t('hrAcademy.assignmentsEmpty')}
				text={t('hrAcademy.assignmentsEmptyText')}
				action={
					<Button
						mt='xs'
						leftSection={<IconUserPlus size={16} />}
						onClick={() => setAssignFor(0)}
					>
						{t('hrAcademy.assignCourse')}
					</Button>
				}
			/>
		);
	} else {
		const { data, meta } = assignments.data;
		listContent = (
			<Stack
				gap='md'
				style={{
					opacity: assignments.isFetching ? 0.6 : 1,
					transition: 'opacity 150ms',
				}}
			>
				<AssignmentsTable items={data} />
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
			<Group justify='space-between' align='flex-end'>
				<div>
					<Title order={2}>{t('hrAcademy.title')}</Title>
					<Text c='dimmed'>{t('hrAcademy.subtitle')}</Text>
				</div>
				<Button
					leftSection={<IconUserPlus size={16} />}
					onClick={() => setAssignFor(0)}
				>
					{t('hrAcademy.assignCourse')}
				</Button>
			</Group>

			{coursesContent}

			<Stack gap='md' ref={listRef} style={{ scrollMarginTop: 80 }}>
				<Title order={3}>{t('hrAcademy.progressTitle')}</Title>

				<Group gap='sm'>
					<Select
						aria-label={t('hrAcademy.course')}
						placeholder={t('hrAcademy.allCourses')}
						data={(courses.data ?? []).map(c => ({
							value: String(c.id),
							label: c.title,
						}))}
						value={course ?? null}
						onChange={value => params.update({ course: value })}
						clearable
						w={{ base: '100%', sm: 260 }}
					/>
					<Select
						aria-label={t('hrAcademy.status')}
						placeholder={t('hrAcademy.allStatuses')}
						data={STATUSES.map(s => ({
							value: s,
							label: t(`academy.status.${s}`),
						}))}
						value={status ?? null}
						onChange={value => params.update({ status: value })}
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
					{hasFilters && (
						<Button
							variant='subtle'
							color='gray'
							leftSection={<IconFilterOff size={16} />}
							onClick={() =>
								params.update({ course: null, status: null, department: null })
							}
						>
							{t('requestList.resetFilters')}
						</Button>
					)}
				</Group>

				{listContent}
			</Stack>

			<AssignCourseModal
				opened={assignFor !== null}
				onClose={() => setAssignFor(null)}
				initialCourseId={assignFor || null}
				onAssigned={id => params.update({ course: String(id), status: null })}
			/>
		</Stack>
	);
}
