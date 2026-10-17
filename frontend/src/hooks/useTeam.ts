import { useQuery } from '@tanstack/react-query';
import { fetchTeamEmployees, TEAM_QUERY_KEY } from '../api/team';

export function useTeamEmployees(enabled = true) {
	return useQuery({
		queryKey: [...TEAM_QUERY_KEY, 'employees'],
		queryFn: fetchTeamEmployees,
		enabled,
	});
}
