import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AI_CHAT_QUERY_KEY, askAi, escalateAiMessage } from '../api/ai';
import { ApiError } from '../api/client';
import { REQUESTS_QUERY_KEY } from '../api/requests';
import type { AiAnswer } from '../types/api';

export type ChatEntry = {
	localId: number;
	question: string;
	state: 'pending' | 'done' | 'error';
	answer?: AiAnswer;
	errorCode?: string;
	// undefined — не передавали; число — id обращения; null — уже было передано раньше (409)
	escalatedRequestId?: number | null;
};

let nextLocalId = 1;

// История чата хранится в кэше TanStack Query: переживает переход к источнику
// и удаляется при выходе (useLogout чистит весь кэш)
export function useAiChat() {
	const queryClient = useQueryClient();
	const { data: entries } = useQuery({
		queryKey: AI_CHAT_QUERY_KEY,
		queryFn: () =>
			queryClient.getQueryData<ChatEntry[]>(AI_CHAT_QUERY_KEY) ?? [],
		initialData: [] as ChatEntry[],
		staleTime: Infinity,
		gcTime: Infinity,
	});

	const update = (fn: (list: ChatEntry[]) => ChatEntry[]) =>
		queryClient.setQueryData<ChatEntry[]>(AI_CHAT_QUERY_KEY, list =>
			fn(list ?? []),
		);

	const patch = (localId: number, changes: Partial<ChatEntry>) =>
		update(list =>
			list.map(e => (e.localId === localId ? { ...e, ...changes } : e)),
		);

	const ask = async (question: string) => {
		const localId = nextLocalId++;
		update(list => [...list, { localId, question, state: 'pending' }]);
		try {
			const answer = await askAi(question);
			patch(localId, { state: 'done', answer });
		} catch (error) {
			patch(localId, {
				state: 'error',
				errorCode: error instanceof ApiError ? error.code : 'unknown',
			});
		}
	};

	const retry = (entry: ChatEntry) => {
		update(list => list.filter(e => e.localId !== entry.localId));
		return ask(entry.question);
	};

	return {
		entries,
		ask,
		retry,
		patch,
		clear: () => update(() => []),
		isAsking: entries.some(e => e.state === 'pending'),
	};
}

export function useEscalateAi() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			messageId,
			comment,
		}: {
			messageId: number;
			comment: string | null;
		}) => escalateAiMessage(messageId, comment),
		onSuccess: () => {
			// Новое обращение появляется в «Моих заявках» и на дашборде
			void queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
			void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
		},
	});
}
