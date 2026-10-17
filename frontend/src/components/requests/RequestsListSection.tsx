import type { ReactNode } from 'react';
import { Group, Pagination, Skeleton, Stack } from '@mantine/core';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Paginated, RequestItem } from '../../types/api';
import { EmptyState } from '../EmptyState';
import { QueryError } from '../QueryError';
import { RequestsTable } from './RequestsTable';

type Props = {
	query: UseQueryResult<Paginated<RequestItem>>;
	page: number;
	onPageChange: (page: number) => void;
	showAuthor?: boolean;
	emptyTitle: string;
	emptyText?: string;
	emptyAction?: ReactNode;
};

export function RequestsListSection({
	query,
	page,
	onPageChange,
	showAuthor,
	emptyTitle,
	emptyText,
	emptyAction,
}: Props) {
	if (query.isPending) {
		return (
			<Stack gap='xs'>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} height={52} radius='md' />
				))}
			</Stack>
		);
	}
	if (query.isError) {
		return <QueryError error={query.error} onRetry={() => query.refetch()} />;
	}
	if (query.data.data.length === 0) {
		return (
			<EmptyState title={emptyTitle} text={emptyText} action={emptyAction} />
		);
	}

	const { data: requests, meta } = query.data;
	return (
		<Stack
			gap='md'
			style={{
				opacity: query.isFetching ? 0.6 : 1,
				transition: 'opacity 150ms',
			}}
		>
			<RequestsTable requests={requests} showAuthor={showAuthor} />
			{meta.last_page > 1 && (
				<Group justify='center'>
					<Pagination
						total={meta.last_page}
						value={page}
						onChange={onPageChange}
					/>
				</Group>
			)}
		</Stack>
	);
}
