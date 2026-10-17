import {
	Box,
	Card,
	Group,
	Paper,
	Progress,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { IconClockExclamation } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { CourseStatusBadge } from '../../../components/academy/CourseStatusBadge';
import type { HrCourseAssignment } from '../../../types/api';
import { formatDate } from '../../../utils/date';

const isOverdue = (a: HrCourseAssignment) =>
	a.status !== 'completed' &&
	a.due_date !== null &&
	dayjs(a.due_date).isBefore(dayjs(), 'day');

function ProgressCell({ item }: { item: HrCourseAssignment }) {
	return (
		<Group gap='xs' wrap='nowrap'>
			<Progress
				value={item.progress_percent}
				color={item.status === 'completed' ? 'green' : 'brand'}
				w={100}
				size='sm'
			/>
			<Text size='xs' fw={500} w={34}>
				{item.progress_percent}%
			</Text>
		</Group>
	);
}

function DueDate({ item }: { item: HrCourseAssignment }) {
	const { t } = useTranslation();
	if (!item.due_date) {
		return (
			<Text size='sm' c='dimmed'>
				{t('hrAcademy.noDueDate')}
			</Text>
		);
	}
	if (isOverdue(item)) {
		return (
			<Group gap={4} wrap='nowrap'>
				<IconClockExclamation size={16} color='var(--mantine-color-red-6)' />
				<Text size='sm' c='red'>
					{formatDate(item.due_date)}
				</Text>
			</Group>
		);
	}
	return (
		<Text size='sm' c={item.status === 'completed' ? 'dimmed' : undefined}>
			{formatDate(item.due_date)}
		</Text>
	);
}

export function AssignmentsTable({ items }: { items: HrCourseAssignment[] }) {
	const { t } = useTranslation();

	return (
		<>
			<Paper withBorder radius='md' visibleFrom='sm'>
				<Box style={{ overflowX: 'auto' }}>
					<Table verticalSpacing='sm' horizontalSpacing='md'>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>{t('hrAcademy.employee')}</Table.Th>
								<Table.Th>{t('hrAcademy.course')}</Table.Th>
								<Table.Th>{t('hrAcademy.status')}</Table.Th>
								<Table.Th>{t('hrAcademy.progress')}</Table.Th>
								<Table.Th>{t('hrAcademy.dueDate')}</Table.Th>
								<Table.Th>{t('hrAcademy.completedAt')}</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{items.map(item => (
								<Table.Tr key={item.id}>
									<Table.Td>
										<Text size='sm' fw={500}>
											{item.user.full_name}
										</Text>
										<Text size='xs' c='dimmed'>
											{item.user.position}
										</Text>
									</Table.Td>
									<Table.Td>
										<Text size='sm'>{item.course.title}</Text>
									</Table.Td>
									<Table.Td>
										<CourseStatusBadge status={item.status} size='sm' />
									</Table.Td>
									<Table.Td>
										<ProgressCell item={item} />
									</Table.Td>
									<Table.Td>
										<DueDate item={item} />
									</Table.Td>
									<Table.Td>
										<Text size='sm' c='dimmed'>
											{item.completed_at ? formatDate(item.completed_at) : '—'}
										</Text>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Box>
			</Paper>

			<Stack hiddenFrom='sm' gap='sm'>
				{items.map(item => (
					<Card key={item.id} withBorder radius='md' padding='md'>
						<Group
							justify='space-between'
							align='flex-start'
							wrap='nowrap'
							mb={4}
						>
							<div>
								<Text size='sm' fw={600}>
									{item.user.full_name}
								</Text>
								<Text size='xs' c='dimmed'>
									{item.user.position}
								</Text>
							</div>
							<CourseStatusBadge status={item.status} size='sm' />
						</Group>
						<Text size='sm' mb={6}>
							{item.course.title}
						</Text>
						<ProgressCell item={item} />
						<Group gap='xs' mt={6}>
							<Text size='xs' c='dimmed'>
								{item.status === 'completed' && item.completed_at
									? t('hrAcademy.completedOn', {
											date: formatDate(item.completed_at),
										})
									: `${t('hrAcademy.dueDate')}:`}
							</Text>
							{!(item.status === 'completed' && item.completed_at) && (
								<DueDate item={item} />
							)}
						</Group>
					</Card>
				))}
			</Stack>
		</>
	);
}
