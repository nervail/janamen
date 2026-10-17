import {
	Button,
	Card,
	ColorSwatch,
	Group,
	Progress,
	SimpleGrid,
	Stack,
	Text,
	Title,
	Tooltip,
} from '@mantine/core';
import { IconListDetails, IconUserPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { AssignmentStatus, HrCourse } from '../../../types/api';

// Цвета совпадают с CourseStatusBadge
const SEGMENTS: { status: AssignmentStatus; color: string }[] = [
	{ status: 'completed', color: 'green.6' },
	{ status: 'in_progress', color: 'blue.6' },
	{ status: 'not_started', color: 'gray.4' },
];

const cssColor = (color: string) =>
	`var(--mantine-color-${color.replace('.', '-')})`;

type Props = {
	course: HrCourse;
	selected: boolean;
	onShowProgress: () => void;
	onAssign: () => void;
};

export function CourseStatsCard({
	course,
	selected,
	onShowProgress,
	onAssign,
}: Props) {
	const { t } = useTranslation();
	const { stats } = course;
	const completionRate = stats.assigned
		? Math.round((stats.completed / stats.assigned) * 100)
		: 0;

	return (
		<Card
			withBorder
			radius='md'
			padding='lg'
			style={
				selected
					? {
							borderColor: 'var(--mantine-color-brand-6)',
							boxShadow: '0 0 0 1px var(--mantine-color-brand-6)',
						}
					: undefined
			}
		>
			<Stack gap='md' h='100%'>
				<div>
					<Title order={4}>{course.title}</Title>
					<Text size='xs' c='dimmed'>
						{t('academy.chapters', { count: course.chapters_count })} ·{' '}
						{t('hrAcademy.assignments', { count: stats.assigned })}
					</Text>
				</div>

				{stats.assigned === 0 ? (
					<Text size='sm' c='dimmed'>
						{t('hrAcademy.notAssignedYet')}
					</Text>
				) : (
					<>
						<Group align='baseline' gap={8}>
							<Text fz={32} fw={700} lh={1}>
								{completionRate}%
							</Text>
							<Text size='sm' c='dimmed'>
								{t('hrAcademy.completionRate')}
							</Text>
						</Group>

						<Progress.Root size='lg' radius='xl'>
							{SEGMENTS.filter(s => stats[s.status] > 0).map(s => (
								<Tooltip
									key={s.status}
									label={`${t(`academy.status.${s.status}`)}: ${stats[s.status]}`}
								>
									<Progress.Section
										value={(stats[s.status] / stats.assigned) * 100}
										color={s.color}
									/>
								</Tooltip>
							))}
						</Progress.Root>

						<SimpleGrid cols={3} spacing='xs'>
							{SEGMENTS.map(s => (
								<div key={s.status}>
									<Group gap={6} wrap='nowrap'>
										<ColorSwatch
											color={cssColor(s.color)}
											size={10}
											withShadow={false}
										/>
										<Text size='xs' c='dimmed' truncate>
											{t(`academy.status.${s.status}`)}
										</Text>
									</Group>
									<Text fw={600}>{stats[s.status]}</Text>
								</div>
							))}
						</SimpleGrid>
					</>
				)}

				<Group gap='xs' mt='auto' grow>
					<Button
						variant={selected ? 'filled' : 'light'}
						onClick={onShowProgress}
						disabled={stats.assigned === 0}
						leftSection={<IconListDetails size={16} />}
					>
						{t('hrAcademy.showProgress')}
					</Button>
					<Button
						variant='default'
						onClick={onAssign}
						leftSection={<IconUserPlus size={16} />}
					>
						{t('hrAcademy.assign')}
					</Button>
				</Group>
			</Stack>
		</Card>
	);
}
