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
