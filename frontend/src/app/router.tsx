import { createBrowserRouter } from 'react-router';
import { AppLayout } from '../layouts/AppLayout';
import { PlaceholderPage } from '../components/PlaceholderPage';

export const router = createBrowserRouter([
	{ path: '/login', element: <PlaceholderPage title='Вход' /> },
	{
		path: '/',
		element: <AppLayout />,
		children: [
			{ index: true, element: <PlaceholderPage title='Главная' /> },
			{ path: 'profile', element: <PlaceholderPage title='Профиль' /> },

			{ path: 'requests', element: <PlaceholderPage title='Мои заявки' /> },
			{
				path: 'requests/new',
				element: <PlaceholderPage title='Новая заявка' />,
			},
			{ path: 'requests/:id', element: <PlaceholderPage title='Заявка' /> },

			{ path: 'courses', element: <PlaceholderPage title='Мои курсы' /> },
			{ path: 'courses/:courseId', element: <PlaceholderPage title='Курс' /> },
			{
				path: 'courses/:courseId/chapters/:chapterId',
				element: <PlaceholderPage title='Глава курса' />,
			},

			{ path: 'assistant', element: <PlaceholderPage title='AI Jana' /> },
			{ path: 'kb', element: <PlaceholderPage title='База знаний' /> },
			{ path: 'kb/:slug', element: <PlaceholderPage title='Документ' /> },

			{ path: 'team', element: <PlaceholderPage title='Моя команда' /> },

			{
				path: 'hr',
				children: [
					{
						path: 'requests',
						element: <PlaceholderPage title='Очередь заявок' />,
					},
					{
						path: 'employees',
						element: <PlaceholderPage title='Сотрудники' />,
					},
					{
						path: 'employees/:userId',
						element: <PlaceholderPage title='Сотрудник' />,
					},
					{ path: 'courses', element: <PlaceholderPage title='Обучение' /> },
					{
						path: 'integrations',
						element: <PlaceholderPage title='Журнал интеграций' />,
					},
				],
			},
			{ path: '*', element: <PlaceholderPage title='Страница не найдена' /> },
		],
	},
]);
