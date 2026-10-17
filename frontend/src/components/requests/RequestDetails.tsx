import type { ReactNode } from 'react';
import { Badge, Box, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { RequestItem } from '../../types/api';
import { formatDateTime, formatPeriod } from '../../utils/date';

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<Box>
			<Text size='xs' c='dimmed'>
				{label}
			</Text>
			<Box fz='sm' style={{ whiteSpace: 'pre-wrap' }}>
				{children}
			</Box>
		</Box>
	);
}

export function RequestDetails({ request }: { request: RequestItem }) {
	const { t } = useTranslation();

	switch (request.type) {
		case 'vacation': {
			const p = request.payload;
			return (
				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md' verticalSpacing='md'>
					<Field label={t('requestCard.vacationType')}>
						{t(`requests.vacationTypes.${p.vacation_type}`)}
					</Field>
					<Field label={t('requestCard.period')}>
						{formatPeriod(p.start_date, p.end_date)}
					</Field>
					<Field label={t('requestCard.days')}>
						{t('profile.days', { count: Number(p.days) })}
					</Field>
					<Field label={t('requestCard.comment')}>{p.comment || '—'}</Field>
					{p.document_ref && (
						<Field label={t('requestCard.documentRef')}>
							<Badge variant='outline' color='blue' radius='sm' tt='none'>
								{p.document_ref}
							</Badge>
						</Field>
					)}
				</SimpleGrid>
			);
		}
		case 'hr_question': {
			const p = request.payload;
			return (
				<Stack gap='md'>
					<Field label={t('requestCard.topic')}>
						{t(`hrTopic.${p.topic}`)}
					</Field>
					<Field label={t('requestCard.question')}>{p.question}</Field>
					{p.answer ? (
						<Paper bg='brand.0' p='md' radius='md'>
							<Text size='sm' fw={600} mb={4}>
								{t('requestCard.answer')}
							</Text>
							<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
								{p.answer}
							</Text>
							{p.answered_at && (
								<Text size='xs' c='dimmed' mt={6}>
									{t('requestCard.answeredAt', {
										date: formatDateTime(p.answered_at),
									})}
								</Text>
							)}
						</Paper>
					) : (
						<Text size='sm' c='dimmed'>
							{t('requestCard.noAnswer')}
						</Text>
					)}
				</Stack>
			);
		}
		case 'advance': {
			const p = request.payload;
			return (
				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
					<Field label={t('requestCard.amount')}>
						{Number(p.amount).toLocaleString('ru-RU')} ₸
					</Field>
					<Field label={t('requestCard.reason')}>{p.reason}</Field>
					<Field label={t('requestCard.comment')}>{p.comment || '—'}</Field>
				</SimpleGrid>
			);
		}
	}
}
