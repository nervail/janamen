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
export type RequestType = 'vacation' | 'hr_question' | 'advance';

export type RequestStatus =
	| 'pending_manager'
	| 'pending_hr'
	| 'awaiting_signature'
	| 'approved'
	| 'rejected'
	| 'cancelled'
	| 'open'
	| 'answered';

export type RequestAction =
	| 'create'
	| 'manager_approve'
	| 'manager_reject'
	| 'hr_approve'
	| 'hr_reject'
	| 'sign'
	| 'cancel'
	| 'answer';

export type VacationType = 'annual_paid' | 'unpaid';

export interface UserBrief {
	id: number;
	full_name: string;
	position: string;
}

export interface VacationPayload {
	vacation_type: VacationType;
	start_date: string;
	end_date: string;
	days: number;
	comment: string | null;
	document_ref: string | null;
}

export interface HrQuestionPayload {
	topic: 'ai_escalation' | 'profile_correction' | 'other';
	question: string;
	ai_message_id: number | null;
	answer: string | null;
	answered_at: string | null;
}

export interface AdvancePayload {
	amount: number;
	reason: string;
	comment: string | null;
}

interface RequestBase {
	id: number;
	status: RequestStatus;
	author: UserBrief;
	current_step: 'manager' | 'hr' | 'signature' | null;
	created_at: string;
	updated_at: string;
}

// Тип payload зависит от type: TypeScript сузит его после проверки request.type
export type RequestItem = RequestBase &
	(
		| { type: 'vacation'; payload: VacationPayload }
		| { type: 'hr_question'; payload: HrQuestionPayload }
		| { type: 'advance'; payload: AdvancePayload }
	);

export interface HistoryEntry {
	id: number;
	action: RequestAction;
	from_status: RequestStatus | null;
	to_status: RequestStatus;
	actor: UserBrief;
	comment: string | null;
	created_at: string;
}

export type RequestDetail = RequestItem & {
	current_approver: UserBrief | null;
	available_actions: RequestAction[];
	history: HistoryEntry[];
};
// Действия, которые можно выполнить через POST /requests/{id}/actions
export type ExecutableAction = Exclude<RequestAction, 'create'>;
export type NotificationEvent =
	| 'request_created'
	| 'request_status_changed'
	| 'request_answered'
	| 'course_assigned'
	| 'course_completed';

// Не Notification: так называется встроенный тип браузера
export interface AppNotification {
	id: string;
	event: NotificationEvent;
	message_key: string;
	params: Record<string, string | number | null>;
	link: { entity_type: 'request' | 'course'; entity_id: number } | null;
	read_at: string | null;
	created_at: string;
}

export interface UnreadCount {
	count: number;
	latest_created_at: string | null;
}
