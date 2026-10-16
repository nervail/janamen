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
	labelKey: string;
	path: string;
	icon: typeof IconHome;
	section: NavSection;
};

export const navItems: NavItem[] = [
	{ labelKey: 'nav.home', path: '/', icon: IconHome, section: 'main' },
	{
		labelKey: 'nav.profile',
		path: '/profile',
		icon: IconUser,
		section: 'main',
	},
	{
		labelKey: 'nav.requests',
		path: '/requests',
		icon: IconFileText,
		section: 'main',
	},
	{
		labelKey: 'nav.courses',
		path: '/courses',
		icon: IconSchool,
		section: 'main',
	},
	{
		labelKey: 'nav.assistant',
		path: '/assistant',
		icon: IconMessageChatbot,
		section: 'main',
	},
	{ labelKey: 'nav.kb', path: '/kb', icon: IconBook, section: 'main' },

	{ labelKey: 'nav.team', path: '/team', icon: IconUsers, section: 'team' },

	{
		labelKey: 'nav.hrRequests',
		path: '/hr/requests',
		icon: IconInbox,
		section: 'hr',
	},
	{
		labelKey: 'nav.hrEmployees',
		path: '/hr/employees',
		icon: IconAddressBook,
		section: 'hr',
	},
	{
		labelKey: 'nav.hrCourses',
		path: '/hr/courses',
		icon: IconCertificate,
		section: 'hr',
	},
	{
		labelKey: 'nav.hrIntegrations',
		path: '/hr/integrations',
		icon: IconPlugConnected,
		section: 'hr',
	},
];

export const sectionLabelKeys: Record<NavSection, string | null> = {
	main: null,
	team: 'nav.sections.team',
	hr: 'nav.sections.hr',
};
