import {
	Anchor,
	Button,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconCircleCheck,
	IconFileText,
	IconMessageQuestion,
	IconRefresh,
	IconSparkles,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useErrorText } from '../../hooks/useErrorText';
import type { ChatEntry } from '../../hooks/useAi';

type Props = {
	entry: ChatEntry;
	onEscalate: () => void;
	onRetry: () => void;
};

export function ChatMessage({ entry, onEscalate, onRetry }: Props) {
	return (
		<Stack gap='xs'>
			<Group justify='flex-end'>
				<Paper
					radius='lg'
					px='md'
					py='sm'
					maw='85%'
					bg='var(--mantine-color-brand-light)'
				>
					<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
						{entry.question}
					</Text>
				</Paper>
			</Group>

			<Group align='flex-start' gap='sm' wrap='nowrap'>
				<ThemeIcon radius='xl' size='lg' variant='light'>
					<IconSparkles size={18} />
				</ThemeIcon>
				<Paper withBorder radius='lg' px='md' py='sm' maw='85%'>
					<AnswerBody entry={entry} onEscalate={onEscalate} onRetry={onRetry} />
				</Paper>
			</Group>
		</Stack>
	);
}

function AnswerBody({ entry, onEscalate, onRetry }: Props) {
	const { t } = useTranslation();
	const errorText = useErrorText();

	if (entry.state === 'pending') {
		return (
			<Group gap='xs'>
				<Loader size='xs' type='dots' />
				<Text size='sm' c='dimmed'>
					{t('assistant.thinking')}
				</Text>
			</Group>
		);
	}

	// Сетевая ошибка, 429 и т. п. — ответа от AI нет вообще
	if (entry.state === 'error' || !entry.answer) {
		return (
			<Stack gap='xs' align='flex-start'>
				<Text size='sm' c='red'>
					{errorText(entry.errorCode)}
				</Text>
				<Button
					size='xs'
					variant='light'
					leftSection={<IconRefresh size={14} />}
					onClick={onRetry}
				>
					{t('assistant.retry')}
				</Button>
			</Stack>
		);
	}

	const { answer } = entry;
	const escalation = <Escalation entry={entry} onEscalate={onEscalate} />;

	if (answer.result !== 'answered') {
		return (
			<Stack gap='sm' align='flex-start'>
				<Text size='sm'>{t(`assistant.result.${answer.result}`)}</Text>
				{escalation}
			</Stack>
		);
	}

	return (
		<Stack gap='sm'>
			<Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
				{answer.answer}
			</Text>

			{answer.sources.length > 0 && (
				<Stack gap={4}>
					<Text size='xs' fw={600} c='dimmed'>
						{t('assistant.sources')}
					</Text>
					{answer.sources.map(s => (
						<Anchor
							key={s.key}
							component={Link}
							to={`/kb/${s.document_slug}#${s.anchor}`}
							size='sm'
						>
							<Group gap={6} wrap='nowrap' align='flex-start'>
								<IconFileText
									size={16}
									style={{ flexShrink: 0, marginTop: 2 }}
								/>
								<span>
									{s.document_title} — {s.section_title}
								</span>
							</Group>
						</Anchor>
					))}
				</Stack>
			)}

			{escalation}
		</Stack>
	);
}

function Escalation({
	entry,
	onEscalate,
}: {
	entry: ChatEntry;
	onEscalate: () => void;
}) {
	const { t } = useTranslation();
	const answered = entry.answer?.result === 'answered';

	if (entry.escalatedRequestId !== undefined) {
		return (
			<Group gap={6}>
				<IconCircleCheck size={16} color='var(--mantine-color-green-6)' />
				<Text size='sm' c='green'>
					{t('assistant.escalated')}
				</Text>
				{entry.escalatedRequestId && (
					<Anchor
						component={Link}
						to={`/requests/${entry.escalatedRequestId}`}
						size='sm'
					>
						{t('assistant.openRequest')}
					</Anchor>
				)}
			</Group>
		);
	}

	if (!entry.answer?.can_escalate) return null;

	// После хорошего ответа — скромная ссылка, после отказа — заметная кнопка
	return answered ? (
		<Button variant='subtle' size='compact-sm' px={0} onClick={onEscalate}>
			{t('assistant.notHelpful')}
		</Button>
	) : (
		<Button
			variant='light'
			size='xs'
			leftSection={<IconMessageQuestion size={14} />}
			onClick={onEscalate}
		>
			{t('assistant.askHr')}
		</Button>
	);
}
