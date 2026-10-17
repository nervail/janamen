import { createBrowserRouter } from 'react-router';
import { AppLayout } from '../layouts/AppLayout';
import { PlaceholderPage } from '../components/PlaceholderPage';
import { LoginPage } from '../pages/LoginPage';
import { GuestOnly, RequireAbility, RequireAuth } from './guards';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { NewRequestPage } from '../pages/requests/NewRequestPage';
import { RequestsPage } from '../pages/requests/RequestsPage';
import { RequestPage } from '../pages/requests/RequestPage';
import { TeamPage } from '../pages/team/TeamPage';
import { HrRequestsPage } from '../pages/hr/HrRequestsPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { MyCoursesPage } from '../pages/academy/MyCoursesPage';
import { CoursePage } from '../pages/academy/CoursePage';
import { ChapterPage } from '../pages/academy/ChapterPage';
import { HrCoursesPage } from '../pages/hr/academy/HrCoursesPage';

export const router = createBrowserRouter([
	{
		element: <GuestOnly />,
		children: [{ path: '/login', element: <LoginPage /> }],
	},
	{
		element: <RequireAuth />,
		children: [
			{
				path: '/',
				element: <AppLayout />,
				children: [
					{ index: true, element: <DashboardPage /> },
					{ path: 'profile', element: <ProfilePage /> },

					{ path: 'requests', element: <RequestsPage /> },
					{ path: 'requests/new', element: <NewRequestPage /> },
					{ path: 'requests/:id', element: <RequestPage /> },

					{ path: 'courses', element: <MyCoursesPage /> },
					{ path: 'courses/:courseId', element: <CoursePage /> },
					{
						path: 'courses/:courseId/chapters/:chapterId',
						element: <ChapterPage />,
					},

					{
						path: 'assistant',
						element: <PlaceholderPage titleKey='pages.assistant' />,
					},
					{ path: 'kb', element: <PlaceholderPage titleKey='pages.kb' /> },
					{
						path: 'kb/:slug',
						element: <PlaceholderPage titleKey='pages.kbDocument' />,
					},

					{
						element: <RequireAbility ability='team' />,
						children: [{ path: 'team', element: <TeamPage /> }],
					},

					{
						path: 'hr',
						element: <RequireAbility ability='hr' />,
						children: [
							{ path: 'requests', element: <HrRequestsPage /> },
							{
								path: 'employees',
								element: <PlaceholderPage titleKey='pages.hrEmployees' />,
							},
							{
								path: 'employees/:userId',
								element: <PlaceholderPage titleKey='pages.hrEmployee' />,
							},
							{ path: 'courses', element: <HrCoursesPage /> },
							{
								path: 'integrations',
								element: <PlaceholderPage titleKey='pages.hrIntegrations' />,
							},
						],
					},

					{ path: '*', element: <PlaceholderPage titleKey='pages.notFound' /> },
				],
			},
		],
	},
]);
