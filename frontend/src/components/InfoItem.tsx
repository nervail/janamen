import { Text } from '@mantine/core';

export function InfoItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<Text size='xs' c='dimmed'>
				{label}
			</Text>
			<Text>{value}</Text>
		</div>
	);
}
