import { Badge, type BadgeProps } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Role } from '../types/api';

const COLORS: Record<Role, string> = {
	employee: 'gray',
	manager: 'grape',
	hr: 'orange',
};

export function RoleBadge({
	role,
	size = 'sm',
}: {
	role: Role;
	size?: BadgeProps['size'];
}) {
	const { t } = useTranslation();
	return (
		<Badge
			color={COLORS[role]}
			variant='light'
			size={size}
			radius='sm'
			tt='none'
		>
			{t(`roles.${role}`)}
		</Badge>
	);
}
