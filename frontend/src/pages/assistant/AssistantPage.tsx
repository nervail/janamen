import { useEffect, useRef, useState } from 'react';
import {
	ActionIcon,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconSend, IconSparkles, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAiChat, type ChatEntry } from '../../hooks/useAi';
import { ChatMessage } from './ChatMessage';
import { EscalateModal } from './EscalateModal';

const EXAMPLES = [
	'vacationDays',
	'howToApply',
	'balance',
	'sickLeave',
] as const;

export function AssistantPage() {
	const { t } = useTranslation();
	const chat = useAiChat();
	const [question, setQuestion] = useState('');
	const [escalating, setEscalating] = useState<ChatEntry | null>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	const last = chat.entries[chat.entries.length - 1];
	// Новый вопрос или пришедший ответ — прокручиваем к концу чата
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
	}, [chat.entries.length, last?.state]);

	const send = (text: string) => {
		const value = text.trim();
		if (!value || chat.isAsking) return;
		setQuestion('');
		void chat.ask(value);
	};

	return (
		<Stack gap='lg' maw={820} mx='auto' w='100%'>
			<Group justify='space-between' align='flex-start'>
				<div>
					<Title order={2}>{t('assistant.title')}</Title>
					<Text c='dimmed'>{t('assistant.subtitle')}</Text>
				</div>
				{chat.entries.length > 0 && (
					<Button
						variant='subtle'
						color='gray'
						leftSection={<IconTrash size={16} />}
						onClick={chat.clear}
						disabled={chat.isAsking}
					>
						{t('assistant.clear')}
					</Button>
				)}
			</Group>

			{chat.entries.length === 0 ? (
				<Paper withBorder radius='md' p='xl'>
					<Stack align='center' gap='sm'>
						<ThemeIcon size={48} radius='xl' variant='light'>
							<IconSparkles size={26} />
						</ThemeIcon>
						<Text fw={600} ta='center'>
							{t('assistant.emptyTitle')}
						</Text>
						<Text size='sm' c='dimmed' ta='center' maw={480}>
							{t('assistant.emptyText')}
						</Text>
						<Group justify='center' gap='xs' mt='xs'>
							{EXAMPLES.map(key => (
								<Button
									key={key}
									variant='light'
									size='xs'
									radius='xl'
									onClick={() => send(t(`assistant.examples.${key}`))}
								>
									{t(`assistant.examples.${key}`)}
								</Button>
							))}
						</Group>
					</Stack>
				</Paper>
			) : (
				<Stack gap='lg'>
					{chat.entries.map(entry => (
						<ChatMessage
							key={entry.localId}
							entry={entry}
							onEscalate={() => setEscalating(entry)}
							onRetry={() => void chat.retry(entry)}
						/>
					))}
					<div ref={bottomRef} />
				</Stack>
			)}

			<form
				onSubmit={e => {
					e.preventDefault();
					send(question);
				}}
				style={{ position: 'sticky', bottom: 16 }}
			>
				<Paper withBorder radius='md' p='sm' shadow='sm'>
					<Group align='flex-end' gap='sm' wrap='nowrap'>
						<Textarea
							style={{ flex: 1 }}
							variant='unstyled'
							autosize
							minRows={1}
							maxRows={5}
							maxLength={1000}
							placeholder={t('assistant.placeholder')}
							aria-label={t('assistant.placeholder')}
							value={question}
							onChange={e => setQuestion(e.currentTarget.value)}
							onKeyDown={e => {
								// Enter — отправить, Shift+Enter — новая строка
								if (
									e.key === 'Enter' &&
									!e.shiftKey &&
									!e.nativeEvent.isComposing
								) {
									e.preventDefault();
									send(question);
								}
							}}
						/>
						<ActionIcon
							type='submit'
							size='lg'
							radius='xl'
							loading={chat.isAsking}
							disabled={!question.trim()}
							aria-label={t('assistant.send')}
						>
							<IconSend size={18} />
						</ActionIcon>
					</Group>
				</Paper>
				<Text size='xs' c='dimmed' mt={6} ta='center'>
					{t('assistant.disclaimer')}
				</Text>
			</form>

			{/* key сбрасывает комментарий и ошибку при открытии для другого вопроса */}
			<EscalateModal
				key={escalating?.localId ?? 0}
				entry={escalating}
				onClose={() => setEscalating(null)}
				onEscalated={(localId, requestId) =>
					chat.patch(localId, { escalatedRequestId: requestId })
				}
			/>
		</Stack>
	);
}
