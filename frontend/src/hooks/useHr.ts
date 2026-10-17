import { useQuery } from '@tanstack/react-query';
import { fetchDepartments, HR_QUERY_KEY } from '../api/hr';

export function useDepartments(enabled = true) {
	return useQuery({
		queryKey: [...HR_QUERY_KEY, 'departments'],
		queryFn: fetchDepartments,
		staleTime: 10 * 60_000, // подразделения меняются редко
		enabled,
	});
}
