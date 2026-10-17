import { api } from './client';
import type {
	AssignCoursePayload,
	AssignCourseResult,
	DataResponse,
	Department,
	HrAssignmentListParams,
	HrCourse,
	HrCourseAssignment,
	HrEmployee,
	HrEmployeeListParams,
	Paginated,
} from '../types/api';

export const HR_QUERY_KEY = ['hr'] as const;
export const HR_COURSES_QUERY_KEY = [...HR_QUERY_KEY, 'courses'] as const;
export const HR_ASSIGNMENTS_QUERY_KEY = [
	...HR_QUERY_KEY,
	'course-assignments',
] as const;
export const HR_EMPLOYEES_QUERY_KEY = [...HR_QUERY_KEY, 'employees'] as const;

export async function fetchDepartments(): Promise<Department[]> {
	const { data } = await api.get<{ data: Department[] }>('/hr/departments');
	return data.data;
}

export async function fetchHrEmployees(
	params: HrEmployeeListParams,
): Promise<Paginated<HrEmployee>> {
	const { data } = await api.get<Paginated<HrEmployee>>('/hr/employees', {
		params,
	});
	return data;
}

export async function fetchHrCourses(): Promise<HrCourse[]> {
	const { data } = await api.get<DataResponse<HrCourse[]>>('/hr/courses');
	return data.data;
}

export async function fetchHrAssignments(
	params: HrAssignmentListParams,
): Promise<Paginated<HrCourseAssignment>> {
	const { data } = await api.get<Paginated<HrCourseAssignment>>(
		'/hr/course-assignments',
		{ params },
	);
	return data;
}

export async function assignCourse(
	payload: AssignCoursePayload,
): Promise<AssignCourseResult> {
	const { data } = await api.post<DataResponse<AssignCourseResult>>(
		'/hr/course-assignments',
		payload,
	);
	return data.data;
}
