import { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Button,
	Group,
	Modal,
	MultiSelect,
	SegmentedControl,
	Select,
	Stack,
	Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
	IconBuildingCommunity,
	IconCalendar,
	IconInfoCircle,
	IconUserPlus,
	IconUsers,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../../api/client';
import { useErrorText } from '../../../hooks/useErrorText';
import {
	useAssignCourse,
	useDepartments,
	useHrAssignments,
	useHrCourses,
	useHrEmployees,
} from '../../../hooks/useHr';
import type { AssignCoursePayload } from '../../../types/api';

type Target = 'users' | 'department';

type FormValues = {
	course_id: string | null;
	target: Target;
	user_ids: string[];
	department_id: string | null;
	due_date: string | null;
};

const FIELDS = ['course_id', 'user_ids', 'department_id', 'due_date'] as const;
type FieldName = (typeof FIELDS)[number];

// Для демо сотрудников немного — грузим всех одной страницей (максимум API)
const ALL = { per_page: 100 };

type Props = {
	opened: boolean;
	onClose: () => void;
	initialCourseId: number | null;
	onAssigned?: (courseId: number) => void;
};

export function AssignCourseModal({
	opened,
	onClose,
	initialCourseId,
	onAssigned,
}: Props) {
	const { t } = useTranslation();
	const errorText = useErrorText();
	const [formError, setFormError] = useState<string | null>(null);

	const courses = useHrCourses();
	const employees = useHrEmployees(ALL, opened);
	const departments = useDepartments(opened);
	const mutation = useAssignCourse();

	const {
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		setError,
		clearErrors,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		defaultValues: {
			course_id: null,
			target: 'users',
			user_ids: [],
			department_id: null,
			due_date: null,
		},
	});

	useEffect(() => {
		if (!opened) return;
		setFormError(null);
		reset({
			course_id: initialCourseId ? String(initialCourseId) : null,
			target: 'users',
			user_ids: [],
			department_id: null,
			due_date: null,
		});
	}, [opened, initialCourseId, reset]);

	const courseId = watch('course_id');
	const target = watch('target');
	const userIds = watch('user_ids');
	const departmentId = watch('department_id');

	// Кто уже проходит выбранный курс: такие сотрудники недоступны для выбора,
	// а при назначении подразделению бэкенд их пропустит
	const assigned = useHrAssignments(
		{ course_id: Number(courseId), ...ALL },
		opened && Boolean(courseId),
	);
	const assignedIds = useMemo(
		() => new Set((assigned.data?.data ?? []).map(a => a.user.id)),
		[assigned.data],
	);

	const employeeList = useMemo(
		() => employees.data?.data ?? [],
		[employees.data],
	);
	const employeeById = useMemo(
		() => new Map(employeeList.map(e => [String(e.user_id), e])),
		[employeeList],
	);

	// Опции, сгруппированные по подразделениям
	const employeeOptions = useMemo(() => {
		const groups = new Map<
			string,
			{ value: string; label: string; disabled: boolean }[]
		>();
		for (const e of employeeList) {
			const items = groups.get(e.department.name) ?? [];
			items.push({
				value: String(e.user_id),
				label: e.full_name,
				disabled: assignedIds.has(e.user_id),
			});
			groups.set(e.department.name, items);
		}
		return [...groups].map(([group, items]) => ({ group, items }));
	}, [employeeList, assignedIds]);

	// Если сменили курс, убираем из выбора тех, кто его уже проходит
	useEffect(() => {
		const current = userIds.filter(id => !assignedIds.has(Number(id)));
		if (current.length !== userIds.length) setValue('user_ids', current);
	}, [assignedIds, userIds, setValue]);

	const departmentMembers = departmentId
		? employeeList.filter(e => String(e.department.id) === departmentId)
		: [];
	const departmentSkipped = departmentMembers.filter(e =>
		assignedIds.has(e.user_id),
	).length;
	const departmentNew = departmentMembers.length - departmentSkipped;

	const today = dayjs().format('YYYY-MM-DD');
	const presets = [
		{ value: dayjs().add(7, 'day').format('YYYY-MM-DD'), label: 'presetWeek' },
		{
			value: dayjs().add(14, 'day').format('YYYY-MM-DD'),
			label: 'presetTwoWeeks',
		},
		{
			value: dayjs().add(1, 'month').format('YYYY-MM-DD'),
			label: 'presetMonth',
		},
	].map(p => ({ ...p, label: t(`hrAcademy.assignModal.${p.label}`) }));

	const onSubmit = handleSubmit(async values => {
		setFormError(null);
		const base = {
			course_id: Number(values.course_id),
			due_date: values.due_date || null,
		};
		const payload: AssignCoursePayload =
			values.target === 'users'
				? { ...base, user_ids: values.user_ids.map(Number) }
				: { ...base, department_id: Number(values.department_id) };

		try {
			const result = await mutation.mutateAsync(payload);
			const skipped = result.skipped_already_assigned;
			if (result.created > 0) {
				notifications.show({
					color: 'green',
					title: t('hrAcademy.assignModal.done'),
					message: skipped
						? t('hrAcademy.assignModal.doneSkipped', {
								created: result.created,
								skipped,
							})
						: t('hrAcademy.assignModal.doneText', { created: result.created }),
				});
			} else {
				notifications.show({
					color: 'yellow',
					title: t('hrAcademy.assignModal.nothing'),
					message: t('hrAcademy.assignModal.nothingText'),
				});
			}
			onAssigned?.(base.course_id);
			onClose();
		} catch (error) {
			if (!(error instanceof ApiError)) {
				setFormError('unknown');
				return;
			}
			if (error.code === 'validation_failed') {
				let handled = false;
				for (const [key, codes] of Object.entries(error.fields)) {
					// user_ids.0 → user_ids
					const field = key.split('.')[0] as FieldName;
					if (!FIELDS.includes(field) || !codes[0]) continue;
					const code =
						field === 'due_date' && codes[0] === 'date_in_past'
							? 'due_date_in_past'
							: codes[0];
					setError(field, { message: code });
					handled = true;
				}
				if (handled) return;
			}
			setFormError(error.code);
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			centered
			size='lg'
			title={t('hrAcademy.assignModal.title')}
		>
			<form onSubmit={onSubmit} noValidate>
				<Stack>
					{formError && (
						<Alert color='red' variant='light'>
							{errorText(formError)}
						</Alert>
					)}

					<Controller
						control={control}
						name='course_id'
						rules={{ required: 'required' }}
						render={({ field }) => (
							<Select
								label={t('hrAcademy.assignModal.course')}
								placeholder={t('hrAcademy.assignModal.coursePlaceholder')}
								withAsterisk
								data={(courses.data ?? []).map(c => ({
									value: String(c.id),
									label: c.title,
								}))}
								value={field.value}
								onChange={field.onChange}
								error={errorText(errors.course_id?.message)}
								allowDeselect={false}
							/>
						)}
					/>

					<Stack gap={6}>
						<Text size='sm' fw={500}>
							{t('hrAcademy.assignModal.target')}
						</Text>
						<Controller
							control={control}
							name='target'
							render={({ field }) => (
								<SegmentedControl
									fullWidth
									value={field.value}
									onChange={value => {
										field.onChange(value as Target);
										clearErrors(['user_ids', 'department_id']);
									}}
									data={[
										{
											value: 'users',
											label: (
												<Group gap={6} justify='center' wrap='nowrap'>
													<IconUsers size={16} />
													<span>{t('hrAcademy.assignModal.targetUsers')}</span>
												</Group>
											),
										},
										{
											value: 'department',
											label: (
												<Group gap={6} justify='center' wrap='nowrap'>
													<IconBuildingCommunity size={16} />
													<span>
														{t('hrAcademy.assignModal.targetDepartment')}
													</span>
												</Group>
											),
										},
									]}
								/>
							)}
						/>
					</Stack>

					{target === 'users' ? (
						<Controller
							control={control}
							name='user_ids'
							rules={{
								validate: value =>
									target !== 'users' || value.length > 0 || 'required',
							}}
							render={({ field }) => (
								<MultiSelect
									label={t('hrAcademy.assignModal.users')}
									placeholder={
										field.value.length
											? undefined
											: t('hrAcademy.assignModal.usersPlaceholder')
									}
									withAsterisk
									searchable
									clearable
									hidePickedOptions
									maxDropdownHeight={280}
									nothingFoundMessage={t('requestList.notFound')}
									data={employeeOptions}
									value={field.value}
									onChange={field.onChange}
									disabled={employees.isPending}
									error={errorText(errors.user_ids?.message)}
									renderOption={({ option }) => {
										const employee = employeeById.get(option.value);
										return (
											<div>
												<Text size='sm'>{option.label}</Text>
												<Text size='xs' c='dimmed'>
													{option.disabled
														? t('hrAcademy.assignModal.alreadyAssigned')
														: employee?.position}
												</Text>
											</div>
										);
									}}
								/>
							)}
						/>
					) : (
						<Controller
							control={control}
							name='department_id'
							rules={{
								validate: value =>
									target !== 'department' || Boolean(value) || 'required',
							}}
							render={({ field }) => (
								<Select
									label={t('hrAcademy.assignModal.department')}
									placeholder={t('hrAcademy.assignModal.departmentPlaceholder')}
									withAsterisk
									searchable
									data={(departments.data ?? []).map(d => ({
										value: String(d.id),
										label: `${d.name} · ${t('hrAcademy.employees', { count: d.employees_count })}`,
									}))}
									value={field.value}
									onChange={field.onChange}
									error={errorText(errors.department_id?.message)}
								/>
							)}
						/>
					)}

					<Controller
						control={control}
						name='due_date'
						render={({ field }) => (
							<DatePickerInput
								label={t('hrAcademy.assignModal.dueDate')}
								placeholder={t('hrAcademy.assignModal.dueDatePlaceholder')}
								value={field.value}
								onChange={field.onChange}
								minDate={today}
								presets={presets}
								clearable
								valueFormat='D MMMM YYYY'
								leftSection={<IconCalendar size={16} />}
								error={errorText(errors.due_date?.message)}
							/>
						)}
					/>

					<AssignSummary
						courseSelected={Boolean(courseId)}
						target={target}
						selectedCount={userIds.length}
						departmentSelected={Boolean(departmentId)}
						departmentNew={departmentNew}
						departmentSkipped={departmentSkipped}
					/>

					<Group justify='flex-end'>
						<Button variant='default' onClick={onClose}>
							{t('hrAcademy.assignModal.cancel')}
						</Button>
						<Button
							type='submit'
							loading={isSubmitting}
							leftSection={<IconUserPlus size={16} />}
						>
							{t('hrAcademy.assignModal.submit')}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}

type SummaryProps = {
	courseSelected: boolean;
	target: Target;
	selectedCount: number;
	departmentSelected: boolean;
	departmentNew: number;
	departmentSkipped: number;
};

// Подсказка перед отправкой: сколько человек получат курс и кого пропустим
function AssignSummary({
	courseSelected,
	target,
	selectedCount,
	departmentSelected,
	departmentNew,
	departmentSkipped,
}: SummaryProps) {
	const { t } = useTranslation();
	const hint = t('hrAcademy.assignModal.notifyHint');

	if (!courseSelected || (target === 'users' && selectedCount === 0)) {
		return (
			<Text size='xs' c='dimmed'>
				{hint}
			</Text>
		);
	}
	if (target === 'department' && !departmentSelected) {
		return (
			<Text size='xs' c='dimmed'>
				{hint}
			</Text>
		);
	}

	const receive = target === 'users' ? selectedCount : departmentNew;
	const skipped = target === 'users' ? 0 : departmentSkipped;
	const nobody = receive === 0;

	return (
		<Alert
			variant='light'
			color={nobody ? 'yellow' : 'brand'}
			icon={<IconInfoCircle size={18} />}
		>
			<Stack gap={2}>
				<Text size='sm' fw={500}>
					{nobody
						? t('hrAcademy.assignModal.allAlreadyAssigned')
						: t('hrAcademy.assignModal.willReceive', {
								count: receive,
								employees: t('hrAcademy.employees', { count: receive }),
							})}
				</Text>
				{skipped > 0 && !nobody && (
					<Text size='xs' c='dimmed'>
						{t('hrAcademy.assignModal.willSkip', { count: skipped })}
					</Text>
				)}
				{!nobody && (
					<Text size='xs' c='dimmed'>
						{hint}
					</Text>
				)}
			</Stack>
		</Alert>
	);
}
