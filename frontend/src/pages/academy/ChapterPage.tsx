import { useState } from 'react';
import {
	Alert,
	Badge,
	Button,
	Divider,
	Group,
	Paper,
	Radio,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import {
	IconArrowLeft,
	IconArrowRight,
	IconCheck,
	IconLock,
	IconRefresh,
	IconTrophy,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { Markdown } from '../../components/Markdown';
import { QueryError } from '../../components/QueryError';
import {
	useChapter,
	useCourse,
	useMarkChapterViewed,
	useSubmitQuiz,
} from '../../hooks/useAcademy';
import { useErrorText } from '../../hooks/useErrorText';
import type { QuizResult } from '../../types/api';

// key по главе: при переходе на следующую главу ответы и результат сбрасываются
export function ChapterPage() {
	const { courseId, chapterId } = useParams();
	return (
		<ChapterView
			key={chapterId}
			courseId={Number(courseId)}
			chapterId={Number(chapterId)}
		/>
	);
}

function ChapterView({
	courseId,
	chapterId,
}: {
	courseId: number;
	chapterId: number;
}) {
	const { t } = useTranslation();
	const errorText = useErrorText();
	const chapterQuery = useChapter(courseId, chapterId);
	const courseQuery = useCourse(courseId);
	const markViewed = useMarkChapterViewed(courseId, chapterId);
	const submit = useSubmitQuiz(courseId, chapterId);

	const [answers, setAnswers] = useState<Record<number, string>>({});
	const [result, setResult] = useState<QuizResult | null>(null);
	const [quizError, setQuizError] = useState<string | null>(null);

	const backButton = (
		<Group>
			<Button
				component={Link}
				to={`/courses/${courseId}`}
				variant='subtle'
				color='gray'
				size='compact-sm'
				leftSection={<IconArrowLeft size={16} />}
			>
				{t('academy.backToCourse')}
			</Button>
		</Group>
	);

	if (chapterQuery.isPending) return <Skeleton height={500} radius='md' />;
	if (chapterQuery.isError) {
		return (
			<Stack gap='lg'>
				{backButton}
				<QueryError error={chapterQuery.error} />
			</Stack>
		);
	}

	const chapter = chapterQuery.data;
	const viewed = chapter.progress.material_viewed;
	const chapters = courseQuery.data?.chapters ?? [];
	const index = chapters.findIndex(c => c.id === chapter.id);
	const nextChapter = index >= 0 ? chapters[index + 1] : undefined;
	const allAnswered = chapter.questions.every(q => answers[q.id]);
	const courseCompleted = result?.course.status === 'completed';

	const onSubmit = async () => {
		setQuizError(null);
		try {
			const payload = chapter.questions.map(q => ({
				question_id: q.id,
				option_id: Number(answers[q.id]),
			}));
			setResult(await submit.mutateAsync(payload));
		} catch (error) {
			if (!(error instanceof ApiError)) {
				setQuizError('unknown');
			} else if (error.code === 'validation_failed') {
				setQuizError(
					Object.values(error.fields)[0]?.[0] ?? 'validation_failed',
				);
			} else {
				setQuizError(error.code);
			}
		}
	};

	const retry = () => {
		setAnswers({});
		setResult(null);
		setQuizError(null);
	};

	return (
		<Stack gap='lg'>
			{backButton}

			<div>
				{courseQuery.data && (
					<Text size='sm' c='dimmed'>
						{courseQuery.data.title}
					</Text>
				)}
				<Title order={2}>
					{t('academy.chapterTitle', {
						n: chapter.position,
						title: chapter.title,
					})}
				</Title>
			</div>

			<Paper withBorder radius='md' p='lg'>
				<Markdown>{chapter.content_md}</Markdown>
				<Divider my='md' />
				{viewed ? (
					<Badge
						color='green'
						variant='light'
						size='lg'
						radius='sm'
						tt='none'
						leftSection={<IconCheck size={14} />}
					>
						{t('academy.materialViewed')}
					</Badge>
				) : (
					<Group justify='space-between' gap='sm'>
						<Text size='sm' c='dimmed'>
							{t('academy.markViewedHint')}
						</Text>
						<Button
							onClick={() => markViewed.mutate()}
							loading={markViewed.isPending}
						>
							{t('academy.markViewed')}
						</Button>
					</Group>
				)}
			</Paper>

			<Paper withBorder radius='md' p='lg'>
				<Title order={4}>{t('academy.quiz')}</Title>
				<Text size='sm' c='dimmed' mb='md'>
					{t('academy.quizHint', { threshold: chapter.pass_threshold })}
				</Text>

				{!viewed ? (
					<Alert color='gray' variant='light' icon={<IconLock size={18} />}>
						{t('academy.quizLocked')}
					</Alert>
				) : (
					<Stack gap='lg'>
						{chapter.progress.passed && !result && (
							<Alert
								color='green'
								variant='light'
								icon={<IconCheck size={18} />}
							>
								{t('academy.chapterDone', {
									score: chapter.progress.last_score,
									max: chapter.progress.max_score,
								})}
							</Alert>
						)}

						{chapter.questions.map((question, i) => (
							<Radio.Group
								key={question.id}
								label={`${i + 1}. ${question.text}`}
								value={answers[question.id] ?? null}
								onChange={value =>
									setAnswers(prev => ({ ...prev, [question.id]: value }))
								}
							>
								<Stack gap='xs' mt='xs'>
									{question.options.map(option => (
										<Radio
											key={option.id}
											value={String(option.id)}
											label={option.text}
											disabled={result !== null}
										/>
									))}
								</Stack>
							</Radio.Group>
						))}

						{quizError && (
							<Alert color='red' variant='light'>
								{errorText(quizError)}
							</Alert>
						)}

						{result && (
							<Alert
								color={result.passed ? 'green' : 'red'}
								variant='light'
								title={t(
									result.passed
										? 'academy.resultPassed'
										: 'academy.resultFailed',
									{
										score: result.score,
										max: result.max_score,
										percent: result.percent,
										threshold: result.threshold,
									},
								)}
							>
								{t('academy.attempts', { count: result.attempts })}
							</Alert>
						)}

						{courseCompleted && (
							<Alert
								color='green'
								variant='filled'
								icon={<IconTrophy size={18} />}
								title={t('academy.courseCompleted')}
							>
								{t('academy.courseCompletedText')}
							</Alert>
						)}

						<Group justify='flex-end'>
							{!result && (
								<Button
									onClick={onSubmit}
									loading={submit.isPending}
									disabled={!allAnswered}
								>
									{t('academy.submitQuiz')}
								</Button>
							)}
							{result && !result.passed && (
								<Button
									variant='light'
									leftSection={<IconRefresh size={16} />}
									onClick={retry}
								>
									{t('academy.retry')}
								</Button>
							)}
							{result?.passed && nextChapter && (
								<Button
									component={Link}
									to={`/courses/${courseId}/chapters/${nextChapter.id}`}
									rightSection={<IconArrowRight size={16} />}
								>
									{t('academy.nextChapter')}
								</Button>
							)}
							{result?.passed && !nextChapter && (
								<Button component={Link} to={`/courses/${courseId}`}>
									{t('academy.backToCourse')}
								</Button>
							)}
						</Group>
					</Stack>
				)}
			</Paper>
		</Stack>
	);
}
