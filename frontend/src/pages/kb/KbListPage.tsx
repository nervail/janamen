import { useState } from 'react';
import {
	Badge,
	Button,
	Card,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconFileText, IconSearch, IconSparkles } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { EmptyState } from '../../components/EmptyState';
import { QueryError } from '../../components/QueryError';
import { useKbDocuments } from '../../hooks/useKb';
import type { KbAccessLevel } from '../../types/api';

export const ACCESS_COLOR: Record<Exclude<KbAccessLevel, 'all'>, string> = {
	manager: 'grape',
	hr: 'orange',
};

const GRID_COLS = { base: 1, sm: 2, lg: 3 };

export function KbListPage() {
	const { t } = useTranslation();
	const documents = useKbDocuments();
	const [search, setSearch] = useState('');

	const query = search.trim().toLowerCase();
	const filtered = (documents.data ?? []).filter(d =>
		d.title.toLowerCase().includes(query),
	);

	let content;
	if (documents.isPending) {
		content = (
			<SimpleGrid cols={GRID_COLS}>
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={i} height={72} radius='md' />
				))}
			</SimpleGrid>
		);
	} else if (documents.isError) {
		content = (
			<QueryError error={documents.error} onRetry={() => documents.refetch()} />
		);
	} else if (documents.data.length === 0) {
		content = <EmptyState title={t('kb.empty')} />;
	} else if (filtered.length === 0) {
		content = (
			<EmptyState title={t('kb.notFound')} text={t('kb.notFoundText')} />
		);
	} else {
		content = (
			<SimpleGrid cols={GRID_COLS}>
				{filtered.map(d => (
					<Card
						key={d.slug}
						component={Link}
						to={`/kb/${d.slug}`}
						withBorder
						radius='md'
						padding='lg'
					>
						<Group justify='space-between' align='flex-start' wrap='nowrap'>
							<Group gap='sm' wrap='nowrap'>
								<ThemeIcon variant='light' radius='md'>
									<IconFileText size={18} />
								</ThemeIcon>
								<Text fw={600}>{d.title}</Text>
							</Group>
							{d.access_level !== 'all' && (
								<Badge
									variant='light'
									size='sm'
									color={ACCESS_COLOR[d.access_level]}
								>
									{t(`kb.access.${d.access_level}`)}
								</Badge>
							)}
						</Group>
					</Card>
				))}
			</SimpleGrid>
		);
	}

	return (
		<Stack gap='lg'>
			<Group justify='space-between' align='flex-end'>
				<div>
					<Title order={2}>{t('kb.title')}</Title>
					<Text c='dimmed'>{t('kb.subtitle')}</Text>
				</div>
				<Button
					component={Link}
					to='/assistant'
					variant='light'
					leftSection={<IconSparkles size={16} />}
				>
					{t('kb.askAi')}
				</Button>
			</Group>

			<TextInput
				leftSection={<IconSearch size={16} />}
				placeholder={t('kb.search')}
				aria-label={t('kb.search')}
				value={search}
				onChange={e => setSearch(e.currentTarget.value)}
				w={{ base: '100%', sm: 360 }}
			/>

			{content}
		</Stack>
	);
}
