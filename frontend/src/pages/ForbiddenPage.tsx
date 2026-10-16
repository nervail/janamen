import { Button, Stack, Text, Title } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function ForbiddenPage() {
	const { t } = useTranslation();

	return (
		<Stack align='flex-start'>
			<IconLock size={40} stroke={1.5} />
			<Title order={2}>{t('pages.forbidden')}</Title>
			<Text c='dimmed'>{t('common.forbiddenText')}</Text>
			<Button component={Link} to='/' variant='light'>
				{t('common.backHome')}
			</Button>
		</Stack>
	);
}
