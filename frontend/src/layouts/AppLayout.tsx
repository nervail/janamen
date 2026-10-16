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
import { Link, Outlet, useLocation } from 'react-router';
import { navItems, sectionLabels, type NavSection } from './navigation';

// Временно: заменим на данные из GET /me
const abilities = { team: true, hr: true };
const currentUser = {
	fullName: 'Сейткали Асель',
	initials: 'АС',
	position: 'Специалист по логистике',
};

function isActive(pathname: string, path: string) {
	if (path === '/') return pathname === '/';
	return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppLayout() {
	const [opened, { toggle, close }] = useDisclosure();
	const { pathname } = useLocation();

	const sections: NavSection[] = ['main'];
	if (abilities.team) sections.push('team');
	if (abilities.hr) sections.push('hr');

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
							aria-label='Меню'
						/>
						<Text
							component={Link}
							to='/'
							fw={700}
							fz='xl'
							c='brand.7'
							td='none'
						>
							JanaMen
						</Text>
					</Group>

					<Group gap='xs' wrap='nowrap'>
						<Indicator label='2' size={16} offset={4}>
							<ActionIcon
								variant='subtle'
								color='gray'
								size='lg'
								aria-label='Уведомления'
							>
								<IconBell size={20} />
							</ActionIcon>
						</Indicator>

						<Menu position='bottom-end' width={220}>
							<Menu.Target>
								<UnstyledButton>
									<Group gap={8} wrap='nowrap'>
										<Avatar color='brand' radius='xl' size='sm'>
											{currentUser.initials}
										</Avatar>
										<Text size='sm' fw={500} visibleFrom='sm'>
											{currentUser.fullName}
										</Text>
										<IconChevronDown size={14} />
									</Group>
								</UnstyledButton>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Label>{currentUser.position}</Menu.Label>
								<Menu.Item
									component={Link}
									to='/profile'
									leftSection={<IconUser size={16} />}
								>
									Профиль
								</Menu.Item>
								<Menu.Item color='red' leftSection={<IconLogout size={16} />}>
									Выйти
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>
				</Group>
			</AppShell.Header>

			<AppShell.Navbar p='sm'>
				<AppShell.Section grow component={ScrollArea}>
					<Stack gap='md'>
						{sections.map(section => (
							<div key={section}>
								{sectionLabels[section] && (
									<Text
										size='xs'
										fw={700}
										c='dimmed'
										tt='uppercase'
										px='sm'
										mb={4}
									>
										{sectionLabels[section]}
									</Text>
								)}
								{navItems
									.filter(item => item.section === section)
									.map(item => (
										<NavLink
											key={item.path}
											component={Link}
											to={item.path}
											label={item.label}
											leftSection={<item.icon size={18} stroke={1.6} />}
											active={isActive(pathname, item.path)}
											onClick={close}
										/>
									))}
							</div>
						))}
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
