import {
	Alert,
	Avatar,
	Button,
	Divider,
	Grid,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconCalendarPlus,
	IconDatabase,
	IconMessageReport,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { QueryError } from '../../components/QueryError';
import { useProfile } from '../../hooks/useProfile';
import { formatDate, formatDateTime } from '../../utils/date';
import { getInitials } from '../../utils/user';
import { ProfileCorrectionModal } from './ProfileCorrectionModal';
import { InfoItem } from '../../components/InfoItem';

function ProfileSkeleton() {
	return (
		<Stack gap='lg'>
			<Skeleton height={160} radius='md' />
			<Grid gap='lg'>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Skeleton height={260} radius='md' />
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 4 }}>
					<Skeleton height={260} radius='md' />
				</Grid.Col>
			</Grid>
		</Stack>
	);
}

export function ProfilePage() {
	const { t } = useTranslation();
	const { data: profile, isPending, isError, error, refetch } = useProfile();
	const [correctionOpened, correction] = useDisclosure(false);

	if (isPending) return <ProfileSkeleton />;
	if (isError) return <QueryError error={error} onRetry={() => refetch()} />;

	const vacation = profile.vacation;

	return (
		<Stack gap='lg'>
			<Paper withBorder radius='md' p='lg'>
				<Group justify='space-between' align='flex-start' gap='md'>
					<Group wrap='nowrap'>
						<Avatar color='brand' radius='xl' size={64}>
							{getInitials(profile.full_name)}
						</Avatar>
						<Stack gap={2}>
							<Title order={2}>{profile.full_name}</Title>
							<Text c='dimmed'>
								{profile.position} · {profile.department.name}
							</Text>
						</Stack>
					</Group>
					<Button
						variant='light'
						leftSection={<IconMessageReport size={16} />}
						onClick={correction.open}
					>
						{t('profile.reportIssue')}
					</Button>
				</Group>

				<Alert
					mt='md'
					variant='light'
					color='gray'
					icon={<IconDatabase size={18} />}
					title={`${t('profile.source')} · ${t('profile.syncedAt', {
						date: formatDateTime(profile.source.synced_at),
					})}`}
				>
					{t('profile.readOnlyHint')}
				</Alert>
			</Paper>

			<Grid gap='lg'>
				<Grid.Col span={{ base: 12, md: 8 }}>
					<Paper withBorder radius='md' p='lg' h='100%'>
						<Title order={4} mb='md'>
							{t('profile.personalData')}
						</Title>
						<SimpleGrid
							cols={{ base: 1, sm: 2 }}
							spacing='md'
							verticalSpacing='md'
						>
							<InfoItem
								label={t('profile.fullName')}
								value={profile.full_name}
							/>
							<InfoItem label={t('profile.company')} value={profile.company} />
							<InfoItem
								label={t('profile.position')}
								value={profile.position}
							/>
							<InfoItem
								label={t('profile.department')}
								value={profile.department.name}
							/>
							<InfoItem
								label={t('profile.manager')}
								value={
									profile.manager
										? `${profile.manager.full_name}, ${profile.manager.position}`
										: t('profile.noManager')
								}
							/>
							<InfoItem
								label={t('profile.hiredAt')}
								value={formatDate(profile.hired_at)}
							/>
						</SimpleGrid>
					</Paper>
				</Grid.Col>

				<Grid.Col span={{ base: 12, md: 4 }}>
					<Paper withBorder radius='md' p='lg' h='100%'>
						<Title order={4} mb='md'>
							{t('profile.vacation')}
						</Title>

						<Text fz={32} fw={700} c='brand.7' lh={1.2}>
							{t('profile.days', { count: Number(vacation.available_days) })}
						</Text>
						<Text size='sm' c='dimmed'>
							{t('profile.available')}
						</Text>

						<Divider my='md' />

						<Stack gap='xs'>
							<Group justify='space-between' wrap='nowrap'>
								<Text size='sm' c='dimmed'>
									{t('profile.balance')}
								</Text>
								<Text size='sm' fw={500}>
									{t('profile.days', { count: Number(vacation.balance_days) })}
								</Text>
							</Group>
							<Group justify='space-between' wrap='nowrap'>
								<Text size='sm' c='dimmed'>
									{t('profile.reserved')}
								</Text>
								<Text size='sm' fw={500}>
									{t('profile.days', { count: Number(vacation.reserved_days) })}
								</Text>
							</Group>
						</Stack>

						<Button
							component={Link}
							to='/requests/new'
							fullWidth
							mt='lg'
							leftSection={<IconCalendarPlus size={16} />}
						>
							{t('profile.requestVacation')}
						</Button>
					</Paper>
				</Grid.Col>
			</Grid>

			<ProfileCorrectionModal
				opened={correctionOpened}
				onClose={correction.close}
			/>
		</Stack>
	);
}
