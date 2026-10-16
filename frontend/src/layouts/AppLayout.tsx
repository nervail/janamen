import { Container } from '@mantine/core';
import { Outlet } from 'react-router';

export function AppLayout() {
	return (
		<Container size='lg' py='xl'>
			<Outlet />
		</Container>
	);
}
