import { useState } from 'react';
import {
	Alert,
	Button,
	Group,
	Modal,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../api/client';
import { useErrorText } from '../../hooks/useErrorText';
import { useProfileCorrection } from '../../hooks/useProfile';

type Props = {
	opened: boolean;
	onClose: () => void;
};

type FormValues = { message: string };

export function ProfileCorrectionModal({ opened, onClose }: Props) {
	const { t } = useTranslation();
	const errorText = useErrorText();
	const mutation = useProfileCorrection();
	const [formError, setFormError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({ defaultValues: { message: '' } });

	const close = () => {
		reset();
		setFormError(null);
		onClose();
	};

	const onSubmit = handleSubmit(async ({ message }) => {
		setFormError(null);
		try {
			await mutation.mutateAsync(message.trim());
			notifications.show({
				color: 'green',
				title: t('profile.correction.success'),
				message: t('profile.correction.successText'),
			});
			close();
		} catch (error) {
			if (
				error instanceof ApiError &&
				error.code === 'validation_failed' &&
				error.fields.message
			) {
				setError('message', { message: error.fields.message[0] });
				return;
			}
			setFormError(error instanceof ApiError ? error.code : 'unknown');
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={close}
			title={t('profile.correction.title')}
			centered
		>
			<form onSubmit={onSubmit} noValidate>
				<Stack>
					<Text size='sm' c='dimmed'>
						{t('profile.correction.description')}
					</Text>

					{formError && (
						<Alert color='red' variant='light'>
							{errorText(formError)}
						</Alert>
					)}

					<Textarea
						label={t('profile.correction.label')}
						placeholder={t('profile.correction.placeholder')}
						autosize
						minRows={4}
						maxLength={2000}
						data-autofocus
						error={errorText(errors.message?.message)}
						{...register('message', {
							validate: value => value.trim().length > 0 || 'required',
							maxLength: { value: 2000, message: 'too_long' },
						})}
					/>

					<Group justify='flex-end'>
						<Button variant='default' onClick={close}>
							{t('profile.correction.cancel')}
						</Button>
						<Button type='submit' loading={isSubmitting}>
							{t('profile.correction.submit')}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
