import {
	Anchor,
	Box,
	Card,
	Group,
	Paper,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import type { RequestItem } from '../../types/api';
import { formatDateTime } from '../../utils/date';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestSummary } from './RequestSummary';

type Props = {
	requests: RequestItem[];
	// Колонка «Сотрудник» нужна в «Моей команде» и очереди HR
	showAuthor?: boolean;
};

export function RequestsTable({ requests, showAuthor = false }: Props) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<>
			<Paper withBorder radius='md' visibleFrom='sm'>
				<Box style={{ overflowX: 'auto' }}>
					<Table highlightOnHover verticalSpacing='sm' horizontalSpacing='md'>
						<Table.Thead>
							<Table.Tr>
								<Table.Th w={70}>{t('requestList.number')}</Table.Th>
								{showAuthor && <Table.Th>{t('requestList.author')}</Table.Th>}
								<Table.Th>{t('requestList.type')}</Table.Th>
								<Table.Th>{t('requestList.details')}</Table.Th>
								<Table.Th>{t('requestList.status')}</Table.Th>
								<Table.Th>{t('requestList.createdAt')}</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{requests.map(request => (
								<Table.Tr
									key={request.id}
									onClick={() => navigate(`/requests/${request.id}`)}
									style={{ cursor: 'pointer' }}
								>
									<Table.Td>
										<Anchor
											component={Link}
											to={`/requests/${request.id}`}
											size='sm'
											onClick={e => e.stopPropagation()}
										>
											#{request.id}
										</Anchor>
									</Table.Td>
									{showAuthor && (
										<Table.Td>
											<Text size='sm' fw={500}>
												{request.author.full_name}
											</Text>
											<Text size='xs' c='dimmed'>
												{request.author.position}
											</Text>
										</Table.Td>
									)}
									<Table.Td>
										<Text size='sm'>{t(`requestType.${request.type}`)}</Text>
									</Table.Td>
									<Table.Td>
										<RequestSummary request={request} />
									</Table.Td>
									<Table.Td>
										<RequestStatusBadge status={request.status} size='sm' />
									</Table.Td>
									<Table.Td>
										<Text size='sm' c='dimmed'>
											{formatDateTime(request.created_at)}
										</Text>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Box>
			</Paper>

			<Stack hiddenFrom='sm' gap='sm'>
				{requests.map(request => (
					<Card
						key={request.id}
						withBorder
						radius='md'
						padding='md'
						component={Link}
						to={`/requests/${request.id}`}
					>
						<Group
							justify='space-between'
							align='flex-start'
							wrap='nowrap'
							mb={6}
						>
							<Text size='sm' fw={600}>
								{t(`requestType.${request.type}`)} · #{request.id}
							</Text>
							<RequestStatusBadge status={request.status} size='sm' />
						</Group>
						{showAuthor && (
							<Text size='sm' mb={4}>
								{request.author.full_name}
							</Text>
						)}
						<RequestSummary request={request} />
						<Text size='xs' c='dimmed' mt={6}>
							{formatDateTime(request.created_at)}
						</Text>
					</Card>
				))}
			</Stack>
		</>
	);
}
