import { Badge, type BadgeProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { AssignmentStatus } from '../../types/api';

const COLORS: Record<AssignmentStatus, string> = {
	not_started: 'gray',
	in_progress: 'blue',
	completed: 'green',
};

export function CourseStatusBadge({
	status,
	size = 'md',
}: {
	status: AssignmentStatus;
	size?: BadgeProps['size'];
}) {
	const { t } = useTranslation();
	return (
		<Badge
			color={COLORS[status]}
			variant='light'
			size={size}
			radius='sm'
			tt='none'
		>
			{t(`academy.status.${status}`)}
		</Badge>
	);
}
