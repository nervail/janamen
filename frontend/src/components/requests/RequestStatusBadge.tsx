import { Badge, type BadgeProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { RequestStatus } from '../../types/api';

const STATUS_COLORS: Record<RequestStatus, string> = {
	pending_manager: 'yellow',
	pending_hr: 'orange',
	awaiting_signature: 'blue',
	approved: 'green',
	rejected: 'red',
	cancelled: 'gray',
	open: 'yellow',
	answered: 'green',
};

type Props = {
	status: RequestStatus;
	size?: BadgeProps['size'];
};

export function RequestStatusBadge({ status, size = 'md' }: Props) {
	const { t } = useTranslation();

	return (
		<Badge
			color={STATUS_COLORS[status]}
			variant='light'
			size={size}
			radius='sm'
			tt='none'
		>
			{t(`requestStatus.${status}`)}
		</Badge>
	);
}
