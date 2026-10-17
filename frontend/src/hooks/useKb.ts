import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchKbDocument, fetchKbDocuments, KB_QUERY_KEY } from '../api/kb';

export function useKbDocuments() {
	const { i18n } = useTranslation();
	return useQuery({
		queryKey: [...KB_QUERY_KEY, 'list', i18n.resolvedLanguage],
		queryFn: fetchKbDocuments,
		staleTime: 10 * 60_000, // регламенты меняются редко
	});
}

export function useKbDocument(slug: string | undefined) {
	const { i18n } = useTranslation();
	return useQuery({
		queryKey: [...KB_QUERY_KEY, 'document', slug, i18n.resolvedLanguage],
		queryFn: () => fetchKbDocument(slug!),
		enabled: Boolean(slug),
		staleTime: 10 * 60_000,
	});
}
