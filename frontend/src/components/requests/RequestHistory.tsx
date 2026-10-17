import { Paper, Text, Timeline } from '@mantine/core';
import {
	IconArrowBackUp,
	IconCheck,
	IconFilePlus,
	IconMessageReply,
	IconSignature,
	IconUserCheck,
	IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { HistoryEntry, RequestAction } from '../../types/api';
import { formatDateTime } from '../../utils/date';

const ICONS: Record<RequestAction, typeof IconCheck> = {
	create: IconFilePlus,
	manager_approve: IconUserCheck,
	manager_reject: IconX,
	hr_approve: IconCheck,
	hr_reject: IconX,
	sign: IconSignature,
	cancel: IconArrowBackUp,
	answer: IconMessageReply,
};

const COLORS: Record<RequestAction, string> = {
	create: 'gray',
	manager_approve: 'green',
	manager_reject: 'red',
	hr_approve: 'green',
	hr_reject: 'red',
	sign: 'brand',
	cancel: 'gray',
	answer: 'brand',
};

export function RequestHistory({ history }: { history: HistoryEntry[] }) {
	const { t } = useTranslation();

	return (
		<Timeline active={history.length - 1} bulletSize={28} lineWidth={2}>
			{history.map(entry => {
				const Icon = ICONS[entry.action];
				return (
					<Timeline.Item
						key={entry.id}
						color={COLORS[entry.action]}
						bullet={<Icon size={14} />}
						title={t(`requestAction.${entry.action}`)}
					>
						<Text size='sm'>
							{entry.actor.full_name}{' '}
							<Text span size='sm' c='dimmed'>
								· {entry.actor.position}
							</Text>
						</Text>
						<Text size='xs' c='dimmed' mt={2}>
							{formatDateTime(entry.created_at)}
						</Text>
						{entry.comment && (
							<Paper mt='xs' p='sm' radius='sm' bg='gray.0'>
								<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
									{entry.comment}
								</Text>
							</Paper>
						)}
					</Timeline.Item>
				);
			})}
		</Timeline>
	);
}
