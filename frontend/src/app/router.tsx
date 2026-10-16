import { createBrowserRouter } from 'react-router';
import { AppLayout } from '../layouts/AppLayout';
import { PlaceholderPage } from '../components/PlaceholderPage';

export const router = createBrowserRouter([
	{ path: '/login', element: <PlaceholderPage titleKey='pages.login' /> },
	{
		path: '/',
		element: <AppLayout />,
		children: [
			{ index: true, element: <PlaceholderPage titleKey='pages.home' /> },
			{
				path: 'profile',
				element: <PlaceholderPage titleKey='pages.profile' />,
			},

			{
				path: 'requests',
				element: <PlaceholderPage titleKey='pages.requests' />,
			},
			{
				path: 'requests/new',
				element: <PlaceholderPage titleKey='pages.requestNew' />,
			},
			{
				path: 'requests/:id',
				element: <PlaceholderPage titleKey='pages.request' />,
			},

			{
				path: 'courses',
				element: <PlaceholderPage titleKey='pages.courses' />,
			},
			{
				path: 'courses/:courseId',
				element: <PlaceholderPage titleKey='pages.course' />,
			},
			{
				path: 'courses/:courseId/chapters/:chapterId',
				element: <PlaceholderPage titleKey='pages.chapter' />,
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

			{ path: 'team', element: <PlaceholderPage titleKey='pages.team' /> },

			{
				path: 'hr',
				children: [
					{
						path: 'requests',
						element: <PlaceholderPage titleKey='pages.hrRequests' />,
					},
					{
						path: 'employees',
						element: <PlaceholderPage titleKey='pages.hrEmployees' />,
					},
					{
						path: 'employees/:userId',
						element: <PlaceholderPage titleKey='pages.hrEmployee' />,
					},
					{
						path: 'courses',
						element: <PlaceholderPage titleKey='pages.hrCourses' />,
					},
					{
						path: 'integrations',
						element: <PlaceholderPage titleKey='pages.hrIntegrations' />,
					},
				],
			},

			{ path: '*', element: <PlaceholderPage titleKey='pages.notFound' /> },
		],
	},
]);
