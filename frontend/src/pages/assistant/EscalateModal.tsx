import { useState } from 'react';
import {
	Alert,
	Blockquote,
	Button,
	Group,
	Modal,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { useEscalateAi, type ChatEntry } from '../../hooks/useAi';
import { useErrorText } from '../../hooks/useErrorText';

type Props = {
	entry: ChatEntry | null;
	onClose: () => void;
	onEscalated: (localId: number, requestId: number | null) => void;
};

export function EscalateModal({ entry, onClose, onEscalated }: Props) {
	const { t } = useTranslation();
	const errorText = useErrorText();
	const mutation = useEscalateAi();
	const [comment, setComment] = useState('');
	const [error, setError] = useState<string | null>(null);

	const submit = async () => {
		if (!entry?.answer) return;
		setError(null);
		try {
			const request = await mutation.mutateAsync({
				messageId: entry.answer.message_id,
				comment: comment.trim() || null,
			});
			onEscalated(entry.localId, request.id);
			notifications.show({
				color: 'green',
				title: t('assistant.escalate.done'),
				message: t('assistant.escalate.doneText'),
			});
			onClose();
		} catch (e) {
			if (e instanceof ApiError && e.code === 'already_escalated') {
				onEscalated(entry.localId, null);
				onClose();
				return;
			}
			setError(e instanceof ApiError ? e.code : 'unknown');
		}
	};

	return (
		<Modal
			opened={entry !== null}
			onClose={onClose}
			centered
			title={t('assistant.escalate.title')}
		>
			<Stack>
				<Text size='sm' c='dimmed'>
					{t('assistant.escalate.hint')}
				</Text>
				{error && (
					<Alert color='red' variant='light'>
						{errorText(error)}
					</Alert>
				)}

				<div>
					<Text size='sm' fw={500} mb={4}>
						{t('assistant.escalate.question')}
					</Text>
					<Blockquote p='sm' radius='md' style={{ whiteSpace: 'pre-wrap' }}>
						{entry?.question}
					</Blockquote>
				</div>

				<Textarea
					label={t('assistant.escalate.comment')}
					placeholder={t('assistant.escalate.commentPlaceholder')}
					autosize
					minRows={2}
					maxLength={1000}
					value={comment}
					onChange={e => setComment(e.currentTarget.value)}
				/>

				<Group justify='flex-end'>
					<Button variant='default' onClick={onClose}>
						{t('assistant.escalate.cancel')}
					</Button>
					<Button onClick={submit} loading={mutation.isPending}>
						{t('assistant.escalate.submit')}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
