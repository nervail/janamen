import type { RequestStatus, RequestType } from '../../types/api';

export const REQUEST_STATUSES: RequestStatus[] = [
	'pending_manager',
	'pending_hr',
	'awaiting_signature',
	'approved',
	'rejected',
	'cancelled',
	'open',
	'answered',
];

// В заявки команды обращения в HR не входят
export const VACATION_STATUSES: RequestStatus[] = [
	'pending_manager',
	'pending_hr',
	'awaiting_signature',
	'approved',
	'rejected',
	'cancelled',
];

export const REQUEST_TYPES: RequestType[] = ['vacation', 'hr_question'];
