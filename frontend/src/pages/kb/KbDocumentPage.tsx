import { useEffect } from 'react';
import {
	Anchor,
	Badge,
	Button,
	Grid,
	Group,
	NavLink,
	Paper,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconArrowLeft, IconSparkles } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { EmptyState } from '../../components/EmptyState';
import { Markdown } from '../../components/Markdown';
import { QueryError } from '../../components/QueryError';
import { useKbDocument } from '../../hooks/useKb';
import { ACCESS_COLOR } from './KbListPage';

// Префикс, чтобы якоря разделов (profile, overview…) не пересекались с другими id на странице
const sectionId = (anchor: string) => `kb-${anchor}`;

const scrollToSection = (anchor: string) =>
	document
		.getElementById(sectionId(anchor))
		?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export function KbDocumentPage() {
	const { t } = useTranslation();
	const { slug } = useParams();
	const { hash } = useLocation();
	const activeAnchor = hash ? decodeURIComponent(hash.slice(1)) : null;
	const doc = useKbDocument(slug);

	// Ссылка из ответа AI ведёт на раздел: прокручиваем к нему, когда документ загрузился
	useEffect(() => {
		if (doc.data && activeAnchor) scrollToSection(activeAnchor);
	}, [doc.data, activeAnchor]);

	const back = (
		<Anchor component={Link} to='/kb' size='sm'>
			<Group gap={4}>
				<IconArrowLeft size={14} />
				{t('kb.back')}
			</Group>
		</Anchor>
	);

	if (doc.isPending) {
		return (
			<Stack gap='lg'>
				{back}
				<Skeleton height={36} w='60%' />
				<Skeleton height={160} radius='md' />
				<Skeleton height={160} radius='md' />
			</Stack>
		);
	}

	if (doc.isError) {
		const status = doc.error instanceof ApiError ? doc.error.status : 0;
		return (
			<Stack gap='lg'>
				{back}
				{status === 403 ? (
					<EmptyState
						title={t('kb.forbiddenTitle')}
						text={t('kb.forbiddenText')}
					/>
				) : status === 404 ? (
					<EmptyState title={t('kb.missingTitle')} text={t('kb.missingText')} />
				) : (
					<QueryError error={doc.error} onRetry={() => doc.refetch()} />
				)}
			</Stack>
		);
	}

	const { data } = doc;

	return (
		<Stack gap='lg'>
			{back}

			<Group justify='space-between' align='flex-start'>
				<Group gap='sm'>
					<Title order={2}>{data.title}</Title>
					{data.access_level !== 'all' && (
						<Badge variant='light' color={ACCESS_COLOR[data.access_level]}>
							{t(`kb.access.${data.access_level}`)}
						</Badge>
					)}
				</Group>
				<Button
					component={Link}
					to='/assistant'
					variant='light'
					leftSection={<IconSparkles size={16} />}
				>
					{t('kb.askAi')}
				</Button>
			</Group>

			<Grid gap='xl'>
				<Grid.Col span={{ base: 12, md: 3 }} visibleFrom='md'>
					<Stack gap={2} style={{ position: 'sticky', top: 80 }}>
						<Text size='xs' fw={700} tt='uppercase' c='dimmed' mb={4}>
							{t('kb.contents')}
						</Text>
						{data.sections.map(s => (
							<NavLink
								key={s.key}
								component={Link}
								to={{ hash: s.anchor }}
								// повторный клик по тому же пункту hash не меняет — прокручиваем вручную
								onClick={() => scrollToSection(s.anchor)}
								label={s.title}
								active={s.anchor === activeAnchor}
								variant='light'
							/>
						))}
					</Stack>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 9 }}>
					<Stack gap='md'>
						{data.sections.map(s => {
							const active = s.anchor === activeAnchor;
							return (
								<Paper
									key={s.key}
									id={sectionId(s.anchor)}
									withBorder
									radius='md'
									p='lg'
									style={{
										scrollMarginTop: 80, // высота шапки 60 + отступ
										borderColor: active
											? 'var(--mantine-color-brand-6)'
											: undefined,
										background: active
											? 'var(--mantine-color-brand-light)'
											: undefined,
										transition: 'background 300ms, border-color 300ms',
									}}
								>
									<Title order={4} mb='xs'>
										{s.title}
									</Title>
									<Markdown breaks>{s.body}</Markdown>
								</Paper>
							);
						})}
					</Stack>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
