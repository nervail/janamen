import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';
import { COURSES_QUERY_KEY } from '../api/academy';
import {
	assignCourse,
	fetchDepartments,
	fetchHrAssignments,
	fetchHrCourses,
	fetchHrEmployees,
	fetchHrEmployee,
	HR_ASSIGNMENTS_QUERY_KEY,
	HR_COURSES_QUERY_KEY,
	HR_EMPLOYEES_QUERY_KEY,
	HR_QUERY_KEY,
} from '../api/hr';
import type {
	AssignCoursePayload,
	HrAssignmentListParams,
	HrEmployeeListParams,
} from '../types/api';

export function useDepartments(enabled = true) {
	return useQuery({
		queryKey: [...HR_QUERY_KEY, 'departments'],
		queryFn: fetchDepartments,
		staleTime: 10 * 60_000, // подразделения меняются редко
		enabled,
	});
}

export function useHrEmployees(params: HrEmployeeListParams, enabled = true) {
	return useQuery({
		queryKey: [...HR_EMPLOYEES_QUERY_KEY, params],
		queryFn: () => fetchHrEmployees(params),
		placeholderData: keepPreviousData,
		staleTime: 60_000,
		enabled,
	});
}

export function useHrCourses() {
	return useQuery({
		queryKey: HR_COURSES_QUERY_KEY,
		queryFn: fetchHrCourses,
	});
}

export function useHrAssignments(
	params: HrAssignmentListParams,
	enabled = true,
) {
	return useQuery({
		queryKey: [...HR_ASSIGNMENTS_QUERY_KEY, params],
		queryFn: () => fetchHrAssignments(params),
		placeholderData: keepPreviousData,
		enabled,
	});
}

export function useAssignCourse() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: AssignCoursePayload) => assignCourse(payload),
		onSuccess: () => {
			// Статистика курсов, список назначений, карточки сотрудников у HR
			void queryClient.invalidateQueries({ queryKey: HR_COURSES_QUERY_KEY });
			void queryClient.invalidateQueries({
				queryKey: HR_ASSIGNMENTS_QUERY_KEY,
			});
			void queryClient.invalidateQueries({ queryKey: HR_EMPLOYEES_QUERY_KEY });
			// HR мог назначить курс себе или своей команде
			void queryClient.invalidateQueries({ queryKey: COURSES_QUERY_KEY });
			void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
			void queryClient.invalidateQueries({ queryKey: ['team'] });
			void queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});
}
export function useHrEmployee(userId: number) {
	return useQuery({
		queryKey: [...HR_EMPLOYEES_QUERY_KEY, 'detail', userId],
		queryFn: () => fetchHrEmployee(userId),
		enabled: Number.isInteger(userId) && userId > 0,
	});
}
