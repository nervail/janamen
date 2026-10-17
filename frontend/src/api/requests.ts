import { api } from './client';
import type {
	DataResponse,
	Paginated,
	RequestDetail,
	RequestItem,
	RequestStatus,
	RequestType,
	VacationType,
	ExecutableAction,
} from '../types/api';

export const REQUESTS_QUERY_KEY = ['requests'] as const;

export interface CreateVacationInput {
	vacation_type: VacationType;
	start_date: string;
	end_date: string;
	comment: string | null;
}

export async function createVacationRequest(
	input: CreateVacationInput,
): Promise<RequestDetail> {
	const { data } = await api.post<DataResponse<RequestDetail>>('/requests', {
		type: 'vacation',
		payload: input,
	});
	return data.data;
}
export interface RequestListParams {
	status?: RequestStatus;
	type?: RequestType;
	page?: number;
	per_page?: number;
}

export async function fetchMyRequests(
	params: RequestListParams,
): Promise<Paginated<RequestItem>> {
	const { data } = await api.get<Paginated<RequestItem>>('/requests', {
		params,
	});
	return data;
}
export const requestQueryKey = (id: number) =>
	[...REQUESTS_QUERY_KEY, 'detail', id] as const;

export async function fetchRequest(id: number): Promise<RequestDetail> {
	const { data } = await api.get<DataResponse<RequestDetail>>(
		`/requests/${id}`,
	);
	return data.data;
}

export interface RequestActionInput {
	action: ExecutableAction;
	comment?: string | null;
	answer?: string;
}

export async function performRequestAction(
	id: number,
	input: RequestActionInput,
): Promise<RequestDetail> {
	const { data } = await api.post<DataResponse<RequestDetail>>(
		`/requests/${id}/actions`,
		input,
	);
	return data.data;
}
export async function fetchTeamRequests(
	params: RequestListParams,
): Promise<Paginated<RequestItem>> {
	const { data } = await api.get<Paginated<RequestItem>>('/team/requests', {
		params,
	});
	return data;
}

export interface HrRequestListParams extends RequestListParams {
	queue?: boolean;
	department_id?: number;
}

export async function fetchHrRequests(
	params: HrRequestListParams,
): Promise<Paginated<RequestItem>> {
	const { data } = await api.get<Paginated<RequestItem>>('/hr/requests', {
		params: { ...params, queue: params.queue ? 1 : undefined },
	});
	return data;
}
