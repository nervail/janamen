import type { ReactNode } from 'react';
import { Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconInbox } from '@tabler/icons-react';

type Props = {
	title: string;
	text?: string;
	action?: ReactNode;
};

export function EmptyState({ title, text, action }: Props) {
	return (
		<Paper withBorder radius='md' p='xl'>
			<Stack align='center' gap='xs'>
				<ThemeIcon size={48} radius='xl' variant='light'>
					<IconInbox size={26} />
				</ThemeIcon>
				<Text fw={600} ta='center'>
					{title}
				</Text>
				{text && (
					<Text size='sm' c='dimmed' ta='center'>
						{text}
					</Text>
				)}
				{action}
			</Stack>
		</Paper>
	);
}
