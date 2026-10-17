import { useQuery } from '@tanstack/react-query';
import { DASHBOARD_QUERY_KEY, fetchDashboard } from '../api/dashboard';

export function useDashboard() {
	return useQuery({ queryKey: DASHBOARD_QUERY_KEY, queryFn: fetchDashboard });
}
