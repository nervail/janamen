import { useEffect } from 'react';
import {
	ActionIcon,
	AppShell,
	Avatar,
	Burger,
	Container,
	Group,
	Indicator,
	Menu,
	NavLink,
	ScrollArea,
	Stack,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
	IconBell,
	IconChevronDown,
	IconLogout,
	IconUser,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useLogout, useMe } from '../hooks/useAuth';
import { getInitials, getShortName } from '../utils/user';
import { navItems, sectionLabelKeys, type NavSection } from './navigation';

function isActive(pathname: string, path: string) {
	if (path === '/') return pathname === '/';
	return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppLayout() {
	const { t, i18n } = useTranslation();
	const [opened, { toggle, close }] = useDisclosure();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { data: me } = useMe();
	const logoutMutation = useLogout();

	// Язык из профиля главнее языка браузера
	const profileLocale = me?.locale;
	useEffect(() => {
		if (profileLocale && profileLocale !== i18n.resolvedLanguage) {
			void i18n.changeLanguage(profileLocale);
		}
	}, [profileLocale, i18n]);

	// RequireAuth не пустит сюда без пользователя, проверка нужна для TypeScript
	if (!me) return null;

	const sections: NavSection[] = ['main'];
	if (me.abilities.team) sections.push('team');
	if (me.abilities.hr) sections.push('hr');

	const handleLogout = () => {
		logoutMutation.mutate(undefined, {
			onSettled: () => navigate('/login', { replace: true }),
		});
	};

	return (
		<AppShell
			header={{ height: 60 }}
			navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
			padding='md'
		>
			<AppShell.Header>
				<Group h='100%' px='md' justify='space-between' wrap='nowrap'>
					<Group gap='sm' wrap='nowrap'>
						<Burger
							opened={opened}
							onClick={toggle}
							hiddenFrom='sm'
							size='sm'
							aria-label={t('nav.menu')}
						/>
						<Text
							component={Link}
							to='/'
							fw={700}
							fz='xl'
							c='brand.7'
							td='none'
						>
							{t('app.name')}
						</Text>
					</Group>

					<Group gap='xs' wrap='nowrap'>
						<LanguageSwitcher />

						<Indicator label='2' size={16} offset={4}>
							<ActionIcon
								variant='subtle'
								color='gray'
								size='lg'
								aria-label={t('header.notifications')}
							>
								<IconBell size={20} />
							</ActionIcon>
						</Indicator>

						<Menu position='bottom-end' width={240}>
							<Menu.Target>
								<UnstyledButton>
									<Group gap={8} wrap='nowrap'>
										<Avatar color='brand' radius='xl' size='sm'>
											{getInitials(me.employee.full_name)}
										</Avatar>
										<Text size='sm' fw={500} visibleFrom='sm'>
											{getShortName(me.employee.full_name)}
										</Text>
										<IconChevronDown size={14} />
									</Group>
								</UnstyledButton>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Label>
									{me.employee.position} · {t(`roles.${me.role}`)}
								</Menu.Label>
								<Menu.Item
									component={Link}
									to='/profile'
									leftSection={<IconUser size={16} />}
								>
									{t('header.profile')}
								</Menu.Item>
								<Menu.Item
									color='red'
									leftSection={<IconLogout size={16} />}
									onClick={handleLogout}
									disabled={logoutMutation.isPending}
								>
									{t('header.logout')}
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>
				</Group>
			</AppShell.Header>

			<AppShell.Navbar p='sm'>
				<AppShell.Section grow component={ScrollArea}>
					<Stack gap='md'>
						{sections.map(section => {
							const labelKey = sectionLabelKeys[section];
							return (
								<div key={section}>
									{labelKey && (
										<Text
											size='xs'
											fw={700}
											c='dimmed'
											tt='uppercase'
											px='sm'
											mb={4}
										>
											{t(labelKey)}
										</Text>
									)}
									{navItems
										.filter(item => item.section === section)
										.map(item => (
											<NavLink
												key={item.path}
												component={Link}
												to={item.path}
												label={t(item.labelKey)}
												leftSection={<item.icon size={18} stroke={1.6} />}
												active={isActive(pathname, item.path)}
												onClick={close}
											/>
										))}
								</div>
							);
						})}
					</Stack>
				</AppShell.Section>
			</AppShell.Navbar>

			<AppShell.Main>
				<Container size='lg' px={0}>
					<Outlet />
				</Container>
			</AppShell.Main>
		</AppShell>
	);
}
