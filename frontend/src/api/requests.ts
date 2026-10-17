import { api } from './client';
import type {
	DataResponse,
	Paginated,
	RequestDetail,
	RequestItem,
	RequestStatus,
	RequestType,
	VacationType,
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
