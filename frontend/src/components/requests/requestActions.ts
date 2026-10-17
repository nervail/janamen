import {
	IconArrowBackUp,
	IconCheck,
	IconMessageReply,
	IconSignature,
	IconX,
} from '@tabler/icons-react';
import type { ExecutableAction } from '../../types/api';

type ActionConfig = {
	color: string;
	variant: 'filled' | 'light' | 'default';
	icon: typeof IconCheck;
	field: 'comment' | 'answer';
	required: boolean;
};

export const ACTION_CONFIG: Record<ExecutableAction, ActionConfig> = {
	manager_approve: {
		color: 'green',
		variant: 'filled',
		icon: IconCheck,
		field: 'comment',
		required: false,
	},
	manager_reject: {
		color: 'red',
		variant: 'light',
		icon: IconX,
		field: 'comment',
		required: true,
	},
	hr_approve: {
		color: 'green',
		variant: 'filled',
		icon: IconCheck,
		field: 'comment',
		required: false,
	},
	hr_reject: {
		color: 'red',
		variant: 'light',
		icon: IconX,
		field: 'comment',
		required: true,
	},
	sign: {
		color: 'brand',
		variant: 'filled',
		icon: IconSignature,
		field: 'comment',
		required: false,
	},
	cancel: {
		color: 'gray',
		variant: 'default',
		icon: IconArrowBackUp,
		field: 'comment',
		required: false,
	},
	answer: {
		color: 'brand',
		variant: 'filled',
		icon: IconMessageReply,
		field: 'answer',
		required: true,
	},
};
