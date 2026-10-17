import { useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Center,
	Divider,
	Group,
	Paper,
	PasswordInput,
	Stack,
	Text,
	TextInput,
	Title,
	Select,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../config/demo';
import { useLogin } from '../hooks/useAuth';
import type { Role } from '../types/api';

const ROLE_ORDER: Role[] = ['employee', 'manager', 'hr'];
type FormValues = { email: string; password: string };

export function LoginPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const loginMutation = useLogin();
	const [formError, setFormError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		setError,
		clearErrors,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({ defaultValues: { email: '', password: '' } });

	const from = (location.state as { from?: string } | null)?.from ?? '/';

	const errorText = (code?: string) =>
		code
			? t(`errors.${code}`, { defaultValue: t('errors.unknown') })
			: undefined;

	const onSubmit = handleSubmit(async values => {
		setFormError(null);
		try {
			await loginMutation.mutateAsync(values);
			navigate(from, { replace: true });
		} catch (error) {
			if (!(error instanceof ApiError)) {
				setFormError('unknown');
				return;
			}
			if (error.code === 'validation_failed') {
				for (const [field, codes] of Object.entries(error.fields)) {
					if (field === 'email' || field === 'password') {
						setError(field, { message: codes[0] });
					}
				}
				return;
			}
			setFormError(error.code);
		}
	});

	const fillDemo = (email: string) => {
		setValue('email', email);
		setValue('password', DEMO_PASSWORD);
		clearErrors();
		setFormError(null);
	};

	return (
		<Box mih='100vh' bg='gray.0' pos='relative'>
			<Group pos='absolute' top={16} right={16}>
				<LanguageSwitcher />
			</Group>

			<Center mih='100vh' p='md'>
				<Paper withBorder radius='md' p='xl' w='100%' maw={420} shadow='sm'>
					<Stack gap='lg'>
						<Stack gap={4}>
							<Text fw={700} fz={28} c='brand.7'>
								{t('app.name')}
							</Text>
							<Title order={3}>{t('auth.title')}</Title>
							<Text size='sm' c='dimmed'>
								{t('auth.subtitle')}
							</Text>
						</Stack>

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

								<TextInput
									label={t('auth.email')}
									placeholder='name@janapost.demo'
									autoComplete='username'
									error={errorText(errors.email?.message)}
									{...register('email', {
										required: 'required',
										pattern: {
											value: /^\S+@\S+\.\S+$/,
											message: 'invalid_email',
										},
									})}
								/>

								<PasswordInput
									label={t('auth.password')}
									autoComplete='current-password'
									error={errorText(errors.password?.message)}
									{...register('password', { required: 'required' })}
								/>

								<Button type='submit' fullWidth loading={isSubmitting}>
									{t('auth.submit')}
								</Button>
							</Stack>
						</form>

						<Divider label={t('auth.demoTitle')} labelPosition='center' />

						<Stack gap='xs'>
							<Text size='xs' c='dimmed' ta='center'>
								{t('auth.demoHint')}
							</Text>
							<Select
								placeholder={t('auth.demoPlaceholder')}
								data={ROLE_ORDER.map(role => ({
									group: t(`roles.${role}`),
									items: DEMO_ACCOUNTS.filter(a => a.role === role).map(
										a => a.email,
									),
								}))}
								onChange={email => email && fillDemo(email)}
								allowDeselect={false}
							/>
						</Stack>
					</Stack>
				</Paper>
			</Center>
		</Box>
	);
}
