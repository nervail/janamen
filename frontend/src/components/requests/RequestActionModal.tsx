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
import { useRequestAction } from '../../hooks/useRequests';
import type { ExecutableAction } from '../../types/api';
import { ACTION_CONFIG } from './requestActions';

type Props = {
	requestId: number;
	action: ExecutableAction | null;
	onClose: () => void;
};

export function RequestActionModal({ requestId, action, onClose }: Props) {
	const { t } = useTranslation();
	const errorText = useErrorText();
	const mutation = useRequestAction(requestId);
	const [formError, setFormError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<{ text: string }>({ defaultValues: { text: '' } });

	const config = action ? ACTION_CONFIG[action] : null;

	const onSubmit = handleSubmit(async ({ text }) => {
		if (!action || !config) return;
		setFormError(null);
		const value = text.trim();

		try {
			await mutation.mutateAsync(
				config.field === 'answer'
					? { action, answer: value }
					: { action, comment: value || null },
			);
			notifications.show({
				color: 'green',
				title: t('requestCard.done'),
				message: t(`requestAction.${action}`),
			});
			onClose();
		} catch (error) {
			if (!(error instanceof ApiError)) {
				setFormError('unknown');
				return;
			}
			const fieldCodes = error.fields[config.field];
			if (error.code === 'validation_failed' && fieldCodes) {
				setError('text', { message: fieldCodes[0] });
				return;
			}
			if (error.code === 'comment_required') {
				setError('text', { message: 'required' });
				return;
			}
			setFormError(error.code);
		}
	});

	const label =
		config?.field === 'answer'
			? t('requestCard.answerLabel')
			: config?.required
				? t('requestCard.commentRequired')
				: t('requestCard.commentOptional');

	return (
		<Modal
			opened={action !== null}
			onClose={onClose}
			centered
			title={action ? t(`requestCard.actions.${action}`) : ''}
		>
			{action && config && (
				<form onSubmit={onSubmit} noValidate>
					<Stack>
						<Text size='sm' c='dimmed'>
							{t(`requestCard.hints.${action}`)}
						</Text>

						{formError && (
							<Alert color='red' variant='light'>
								{errorText(formError)}
							</Alert>
						)}

						<Textarea
							label={label}
							withAsterisk={config.required}
							autosize
							minRows={3}
							maxLength={config.field === 'answer' ? 5000 : 2000}
							data-autofocus
							error={errorText(errors.text?.message)}
							{...register('text', {
								validate: value =>
									!config.required || value.trim().length > 0 || 'required',
							})}
						/>

						<Group justify='flex-end'>
							<Button variant='default' onClick={onClose}>
								{t('requestCard.cancelButton')}
							</Button>
							<Button
								type='submit'
								color={config.color}
								loading={isSubmitting}
								leftSection={<config.icon size={16} />}
							>
								{t(`requestCard.actions.${action}`)}
							</Button>
						</Group>
					</Stack>
				</form>
			)}
		</Modal>
	);
}
