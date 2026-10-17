export type Role = 'employee' | 'manager' | 'hr';
export type Locale = 'ru' | 'kz' | 'en';

export interface DataResponse<T> {
	data: T;
}

export interface PaginationMeta {
	current_page: number;
	per_page: number;
	total: number;
	last_page: number;
}

export interface Paginated<T> {
	data: T[];
	meta: PaginationMeta;
}

export interface ApiErrorBody {
	code: string;
	message: string;
	fields?: Record<string, string[]>;
}

export interface ApiErrorResponse {
	error: ApiErrorBody;
}

export interface Me {
	id: number;
	email: string;
	role: Role;
	locale: Locale;
	employee: {
		id: number;
		full_name: string;
		position: string;
		department: { id: number; name: string };
	};
	abilities: {
		team: boolean;
		hr: boolean;
	};
}
export interface VacationSummary {
	balance_days: number;
	reserved_days: number;
	available_days: number;
}

export interface Profile {
	last_name: string;
	first_name: string;
	middle_name: string | null;
	full_name: string;
	company: string;
	position: string;
	department: { id: number; name: string };
	manager: { full_name: string; position: string } | null;
	hired_at: string;
	vacation: VacationSummary;
	source: { system: string; synced_at: string };
}
