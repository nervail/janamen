import { Stack, Text, Title } from '@mantine/core';
import { useLocation } from 'react-router';

type Props = { title: string };

export function PlaceholderPage({ title }: Props) {
	const location = useLocation();

	return (
		<Stack>
			<Title order={2}>{title}</Title>
			<Text c='dimmed'>Экран в разработке · {location.pathname}</Text>
		</Stack>
	);
}
