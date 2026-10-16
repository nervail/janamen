import { Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

type Props = { titleKey: string };

export function PlaceholderPage({ titleKey }: Props) {
	const { t } = useTranslation();
	const location = useLocation();

	return (
		<Stack>
			<Title order={2}>{t(titleKey)}</Title>
			<Text c='dimmed'>
				{t('common.inDevelopment')} · {location.pathname}
			</Text>
		</Stack>
	);
}
