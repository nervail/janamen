import { useSearchParams } from 'react-router';

export function useListParams() {
	const [searchParams, setSearchParams] = useSearchParams();

	const get = (key: string) => searchParams.get(key) ?? undefined;
	const page = Number(searchParams.get('page')) || 1;

	// Любая смена фильтра или вкладки возвращает на первую страницу
	const update = (changes: Record<string, string | null>) => {
		const next = new URLSearchParams(searchParams);
		for (const [key, value] of Object.entries(changes)) {
			if (value) next.set(key, value);
			else next.delete(key);
		}
		if (!('page' in changes)) next.delete('page');
		setSearchParams(next, { replace: true });
	};

	return { get, page, update };
}
