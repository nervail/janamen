import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';

export default function App() {
	return (
		<Container size='sm' py='xl'>
			<Stack>
				<Title order={1}>JanaMen</Title>
				<Text c='dimmed'>Цифровое пространство сотрудника</Text>
				<Button
					w='fit-content'
					onClick={() =>
						notifications.show({
							title: 'Работает',
							message: 'Mantine подключён',
						})
					}
				>
					Проверить
				</Button>
			</Stack>
		</Container>
	);
}
