import {
	IconAddressBook,
	IconBook,
	IconCertificate,
	IconFileText,
	IconHome,
	IconInbox,
	IconMessageChatbot,
	IconPlugConnected,
	IconSchool,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';

export type NavSection = 'main' | 'team' | 'hr';

export type NavItem = {
	label: string;
	path: string;
	icon: typeof IconHome;
	section: NavSection;
};

export const navItems: NavItem[] = [
	{ label: 'Главная', path: '/', icon: IconHome, section: 'main' },
	{ label: 'Профиль', path: '/profile', icon: IconUser, section: 'main' },
	{
		label: 'Мои заявки',
		path: '/requests',
		icon: IconFileText,
		section: 'main',
	},
	{ label: 'Мои курсы', path: '/courses', icon: IconSchool, section: 'main' },
	{
		label: 'AI Jana',
		path: '/assistant',
		icon: IconMessageChatbot,
		section: 'main',
	},
	{ label: 'База знаний', path: '/kb', icon: IconBook, section: 'main' },

	{ label: 'Моя команда', path: '/team', icon: IconUsers, section: 'team' },

	{
		label: 'Очередь заявок',
		path: '/hr/requests',
		icon: IconInbox,
		section: 'hr',
	},
	{
		label: 'Сотрудники',
		path: '/hr/employees',
		icon: IconAddressBook,
		section: 'hr',
	},
	{
		label: 'Обучение',
		path: '/hr/courses',
		icon: IconCertificate,
		section: 'hr',
	},
	{
		label: 'Журнал интеграций',
		path: '/hr/integrations',
		icon: IconPlugConnected,
		section: 'hr',
	},
];

export const sectionLabels: Record<NavSection, string | null> = {
	main: null,
	team: 'Руководителю',
	hr: 'HR',
};
