import {
	Alert,
	Badge,
	Group,
	List,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconDatabase,
	IconFileText,
	IconInfoCircle,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const SYSTEMS = [
	{ key: 'onec', icon: IconDatabase, color: 'yellow' },
	{ key: 'documentolog', icon: IconFileText, color: 'blue' },
] as const;

export function IntegrationsPage() {
	const { t } = useTranslation();

	return (
		<Stack gap='lg'>
			<div>
				<Title order={2}>{t('hrIntegrations.title')}</Title>
				<Text c='dimmed'>{t('hrIntegrations.subtitle')}</Text>
			</div>

			<Alert variant='light' color='brand' icon={<IconInfoCircle size={18} />}>
				{t('hrIntegrations.notice')}
			</Alert>

			<SimpleGrid cols={{ base: 1, md: 2 }}>
				{SYSTEMS.map(({ key, icon: Icon, color }) => (
					<Paper key={key} withBorder radius='md' p='lg'>
						<Stack gap='md'>
							<Group justify='space-between' align='flex-start' wrap='nowrap'>
								<Group gap='sm' wrap='nowrap'>
									<ThemeIcon
										size={44}
										radius='md'
										variant='light'
										color={color}
									>
										<Icon size={24} />
									</ThemeIcon>
									<div>
										<Text fw={600}>{t(`hrIntegrations.${key}.name`)}</Text>
										<Text size='sm' c='dimmed'>
											{t(`hrIntegrations.${key}.description`)}
										</Text>
									</div>
								</Group>
								<Badge variant='light' color='gray' tt='none'>
									{t('hrIntegrations.status')}
								</Badge>
							</Group>

							<div>
								<Text size='xs' fw={700} tt='uppercase' c='dimmed' mb={6}>
									{t('hrIntegrations.nowTitle')}
								</Text>
								<Text size='sm'>{t(`hrIntegrations.${key}.now`)}</Text>
							</div>

							<div>
								<Text size='xs' fw={700} tt='uppercase' c='dimmed' mb={6}>
									{t('hrIntegrations.futureTitle')}
								</Text>
								<List size='sm' spacing={4}>
									{(['f1', 'f2', 'f3'] as const).map(f => (
										<List.Item key={f}>
											{t(`hrIntegrations.${key}.${f}`)}
										</List.Item>
									))}
								</List>
							</div>
						</Stack>
					</Paper>
				))}
			</SimpleGrid>
		</Stack>
	);
}
