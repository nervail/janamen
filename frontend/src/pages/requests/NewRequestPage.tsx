import { useState } from 'react';
import {
	Alert,
	Button,
	Grid,
	Group,
	Paper,
	Radio,
	Skeleton,
	Stack,
	Text,
	Textarea,
	Timeline,
	Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
	IconAlertCircle,
	IconCalendar,
	IconFileCheck,
	IconUserCheck,
	IconUsers,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../../api/client';
import { QueryError } from '../../components/QueryError';
import { useErrorText } from '../../hooks/useErrorText';
import { useProfile } from '../../hooks/useProfile';
import { useCreateVacationRequest } from '../../hooks/useRequests';
import type { VacationType } from '../../types/api';
import { countDays } from '../../utils/date';

type FormValues = {
	vacation_type: VacationType;
	period: [string | null, string | null];
	comment: string;
};

// Поля ошибок сервера → поля формы
const FIELD_MAP: Record<string, keyof FormValues> = {
	'payload.vacation_type': 'vacation_type',
	'payload.start_date': 'period',
	'payload.end_date': 'period',
	'payload.comment': 'comment',
};

function SummaryRow({
	label,
	value,
	color,
}: {
	label: string;
	value: string;
	color?: string;
}) {
	return (
		<Group justify='space-between' wrap='nowrap'>
			<Text size='sm' c='dimmed'>
				{label}
			</Text>
			<Text size='sm' fw={500} c={color}>
				{value}
			</Text>
		</Group>
	);
}

export function NewRequestPage() {
	const { t } = useTranslation();
	const errorText = useErrorText();
	const navigate = useNavigate();
	const profileQuery = useProfile();
	const mutation = useCreateVacationRequest();
	const [formError, setFormError] = useState<string | null>(null);

	const {
		control,
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		defaultValues: {
			vacation_type: 'annual_paid',
			period: [null, null],
			comment: '',
		},
	});

	const [start, end] = useWatch({ control, name: 'period' });
	const vacationType = useWatch({ control, name: 'vacation_type' });

	if (profileQuery.isPending) return <Skeleton height={420} radius='md' />;
	if (profileQuery.isError) {
		return (
			<QueryError
				error={profileQuery.error}
				onRetry={() => profileQuery.refetch()}
			/>
		);
	}

	const profile = profileQuery.data;
	const available = Number(profile.vacation.available_days);
	const days = start && end ? countDays(start, end) : 0;
	const consumesBalance = vacationType === 'annual_paid';
	const remaining = available - (consumesBalance ? days : 0);
	const today = dayjs().format('YYYY-MM-DD');

	const onSubmit = handleSubmit(async ({ vacation_type, period, comment }) => {
		setFormError(null);
		const [startDate, endDate] = period;
		if (!startDate || !endDate) return;

		try {
			const request = await mutation.mutateAsync({
				vacation_type,
				start_date: startDate,
				end_date: endDate,
				comment: comment.trim() || null,
			});
			notifications.show({
				color: 'green',
				title: t('requests.created'),
				message: t('requests.createdText'),
			});
			navigate(`/requests/${request.id}`);
		} catch (error) {
			if (!(error instanceof ApiError)) {
				setFormError('unknown');
				return;
			}
			if (error.code === 'validation_failed') {
				let mapped = false;
				for (const [key, codes] of Object.entries(error.fields)) {
					const field = FIELD_MAP[key];
					if (field) {
						setError(field, { message: codes[0] });
						mapped = true;
					}
				}
				if (!mapped) setFormError('validation_failed');
				return;
			}
			setFormError(error.code);
		}
	});

	return (
		<Stack gap='lg'>
			<div>
				<Title order={2}>{t('requests.newVacationTitle')}</Title>
				<Text c='dimmed'>{t('requests.newVacationSubtitle')}</Text>
			</div>

			<Grid gap='lg'>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Paper withBorder radius='md' p='lg'>
						<form onSubmit={onSubmit} noValidate>
							<Stack gap='md'>
								{formError && (
									<Alert
										color='red'
										variant='light'
										icon={<IconAlertCircle size={18} />}
									>
										{errorText(formError)}
									</Alert>
								)}

								<Controller
									control={control}
									name='vacation_type'
									render={({ field }) => (
										<Radio.Group
											label={t('requests.vacationType')}
											value={field.value}
											onChange={value => field.onChange(value as VacationType)}
											error={errorText(errors.vacation_type?.message)}
										>
											<Stack gap='xs' mt='xs'>
												<Radio
													value='annual_paid'
													label={t('requests.vacationTypes.annual_paid')}
												/>
												<Radio
													value='unpaid'
													label={t('requests.vacationTypes.unpaid')}
												/>
											</Stack>
										</Radio.Group>
									)}
								/>

								<Controller
									control={control}
									name='period'
									rules={{
										validate: ([startDate, endDate], values) => {
											if (!startDate || !endDate) return 'required';
											if (dayjs(startDate).isBefore(dayjs(), 'day'))
												return 'date_in_past';
											if (dayjs(endDate).isBefore(dayjs(startDate), 'day')) {
												return 'end_before_start';
											}
											if (
												values.vacation_type === 'annual_paid' &&
												countDays(startDate, endDate) > available
											) {
												return 'insufficient_balance';
											}
											return true;
										},
									}}
									render={({ field }) => (
										<DatePickerInput
											type='range'
											label={t('requests.period')}
											placeholder={t('requests.periodPlaceholder')}
											value={field.value}
											onChange={field.onChange}
											minDate={today}
											allowSingleDateInRange
											clearable
											valueFormat='D MMMM YYYY'
											leftSection={<IconCalendar size={16} />}
											error={errorText(errors.period?.message)}
										/>
									)}
								/>

								<Textarea
									label={t('requests.comment')}
									placeholder={t('requests.commentPlaceholder')}
									autosize
									minRows={3}
									maxLength={1000}
									error={errorText(errors.comment?.message)}
									{...register('comment', {
										maxLength: { value: 1000, message: 'too_long' },
									})}
								/>

								<Group justify='flex-end'>
									<Button variant='default' component={Link} to='/requests'>
										{t('requests.cancel')}
									</Button>
									<Button type='submit' loading={isSubmitting}>
										{t('requests.submit')}
									</Button>
								</Group>
							</Stack>
						</form>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 4 }}>
					<Stack gap='lg'>
						<Paper withBorder radius='md' p='lg'>
							<Title order={5} mb='sm'>
								{t('requests.summary')}
							</Title>
							<Stack gap='xs'>
								<SummaryRow
									label={t('requests.daysSelected')}
									value={
										days
											? t('profile.days', { count: days })
											: t('requests.notSelected')
									}
								/>
								<SummaryRow
									label={t('requests.availableNow')}
									value={t('profile.days', { count: available })}
								/>
								<SummaryRow
									label={t('requests.remainingAfter')}
									value={t('profile.days', { count: remaining })}
									color={remaining < 0 ? 'red' : undefined}
								/>
							</Stack>
							{!consumesBalance && (
								<Text size='xs' c='dimmed' mt='sm'>
									{t('requests.unpaidHint')}
								</Text>
							)}
						</Paper>

						<Paper withBorder radius='md' p='lg'>
							<Title order={5} mb='md'>
								{t('requests.route')}
							</Title>
							<Timeline bulletSize={24} lineWidth={2}>
								{profile.manager && (
									<Timeline.Item
										bullet={<IconUserCheck size={14} />}
										title={t('profile.manager')}
									>
										<Text size='sm' c='dimmed'>
											{profile.manager.full_name}
										</Text>
									</Timeline.Item>
								)}
								<Timeline.Item
									bullet={<IconUsers size={14} />}
									title={t('requests.routeHr')}
								/>
								<Timeline.Item
									bullet={<IconFileCheck size={14} />}
									title={t('requests.routeSignature')}
								/>
							</Timeline>
						</Paper>
					</Stack>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
