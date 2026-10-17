import { Alert, Button, Stack, Text } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import { useErrorText } from '../hooks/useErrorText';

type Props = {
	error: unknown;
	onRetry?: () => void;
};

export function QueryError({ error, onRetry }: Props) {
	const { t } = useTranslation();
	const errorText = useErrorText();
	const code = error instanceof ApiError ? error.code : 'unknown';

	return (
		<Alert
			color='red'
			variant='light'
			icon={<IconAlertCircle size={18} />}
			title={t('common.loadError')}
		>
			<Stack gap='sm' align='flex-start'>
				<Text size='sm'>{errorText(code)}</Text>
				{onRetry && (
					<Button size='xs' variant='light' color='red' onClick={onRetry}>
						{t('common.retry')}
					</Button>
				)}
			</Stack>
		</Alert>
	);
}
