import { api } from './client';
import type { AiAnswer, DataResponse, RequestDetail } from '../types/api';

export const AI_CHAT_QUERY_KEY = ['ai', 'chat'] as const;

export async function askAi(question: string): Promise<AiAnswer> {
	const { data } = await api.post<DataResponse<AiAnswer>>('/ai/ask', {
		question,
	});
	return data.data;
}

export async function escalateAiMessage(
	messageId: number,
	comment: string | null,
): Promise<RequestDetail> {
	const { data } = await api.post<DataResponse<RequestDetail>>(
		`/ai/messages/${messageId}/escalate`,
		comment ? { comment } : {},
	);
	return data.data;
}
