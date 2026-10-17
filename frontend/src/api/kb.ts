import { api } from './client';
import type { DataResponse, KbDocument, KbDocumentItem } from '../types/api';

export const KB_QUERY_KEY = ['kb'] as const;

export async function fetchKbDocuments(): Promise<KbDocumentItem[]> {
	const { data } =
		await api.get<DataResponse<KbDocumentItem[]>>('/kb/documents');
	return data.data;
}

export async function fetchKbDocument(slug: string): Promise<KbDocument> {
	const { data } = await api.get<DataResponse<KbDocument>>(
		`/kb/documents/${encodeURIComponent(slug)}`,
	);
	return data.data;
}
