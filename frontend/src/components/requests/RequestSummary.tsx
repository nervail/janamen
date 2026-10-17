import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { RequestItem } from '../../types/api';
import { formatPeriod } from '../../utils/date';

// Что показать в строке списка: период отпуска, тему обращения или сумму аванса
export function RequestSummary({ request }: { request: RequestItem }) {
	const { t } = useTranslation();

	switch (request.type) {
		case 'vacation': {
			const p = request.payload;
			return (
				<div>
					<Text size='sm' fw={500}>
						{formatPeriod(p.start_date, p.end_date)}
					</Text>
					<Text size='xs' c='dimmed'>
						{t(`requests.vacationTypes.${p.vacation_type}`)} ·{' '}
						{t('profile.days', { count: Number(p.days) })}
					</Text>
				</div>
			);
		}
		case 'hr_question': {
			const p = request.payload;
			return (
				<div>
					<Text size='sm' fw={500}>
						{t(`hrTopic.${p.topic}`)}
					</Text>
					<Text size='xs' c='dimmed' lineClamp={1}>
						{p.question}
					</Text>
				</div>
			);
		}
		case 'advance': {
			const p = request.payload;
			return (
				<div>
					<Text size='sm' fw={500}>
						{Number(p.amount).toLocaleString('ru-RU')} ₸
					</Text>
					<Text size='xs' c='dimmed' lineClamp={1}>
						{p.reason}
					</Text>
				</div>
			);
		}
	}
}
